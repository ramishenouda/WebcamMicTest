import { useState, useEffect, useRef } from 'react'

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  const [status, setStatus] = useState('waiting for permission')
  const [cameras, setCameras] = useState([])
  const [microphones, setMicrophones] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedMic, setSelectedMic] = useState('')
  const [isMirror, setIsMirror] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [isRecording, setIsRecording] = useState(false)

  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const audioProcessorRef = useRef(null)

  // Enumerate devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cams = devices.filter(d => d.kind === 'videoinput')
        const mics = devices.filter(d => d.kind === 'audioinput')
        setCameras(cams)
        setMicrophones(mics)
        if (cams.length > 0) setSelectedCamera(cams[0].deviceId)
        if (mics.length > 0) setSelectedMic(mics[0].deviceId)
      } catch (err) {
        console.error('Error enumerating devices:', err)
      }
    }

    getDevices()

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices)
  }, [])

  // Update mic level from analyser
  useEffect(() => {
    if (!analyserRef.current) return

    const updateLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length
      setMicLevel(Math.round(average))
      requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }, [])

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const requestAccess = async () => {
    try {
      setStatus('requesting access')
      cleanup()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
        },
        audio: {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
        },
      })

      streamRef.current = stream

      // Attach video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Setup audio analysis
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }

      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      setStatus('working')

      // Re-enumerate devices after permission granted to get full labels
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter(d => d.kind === 'videoinput')
      const mics = devices.filter(d => d.kind === 'audioinput')
      setCameras(cams)
      setMicrophones(mics)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setStatus('error: permission denied')
      } else if (err.name === 'NotFoundError') {
        setStatus('error: device not found')
      } else {
        setStatus('error: ' + err.message)
      }
      cleanup()
    }
  }

  // Auto-request access on mount when devices are ready
  useEffect(() => {
    if (selectedCamera && selectedMic && status === 'waiting for permission') {
      const timer = setTimeout(() => {
        requestAccess()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [selectedCamera, selectedMic, status])

  const handleRestart = () => {
    requestAccess()
  }

  const handleCameraChange = (e) => {
    const newCameraId = e.target.value
    setSelectedCamera(newCameraId)
    // Trigger access with new camera
    setTimeout(() => {
      cleanup()
      const newStream = navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: newCameraId } },
        audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined },
      })
      newStream.then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }).catch(err => {
        setStatus('error: ' + err.message)
      })
    }, 0)
  }

  const handleMicChange = (e) => {
    const newMicId = e.target.value
    setSelectedMic(newMicId)
    // Trigger access with new microphone
    setTimeout(() => {
      cleanup()
      const newStream = navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined },
        audio: { deviceId: { exact: newMicId } },
      })
      newStream.then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        // Reconnect audio analyser
        if (audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream)
          const analyser = audioContextRef.current.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          analyserRef.current = analyser
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
        }
      }).catch(err => {
        setStatus('error: ' + err.message)
      })
    }, 0)
  }

  const handleMirrorToggle = () => {
    setIsMirror(!isMirror)
  }

  const handleRecord = () => {
    if (!streamRef.current) return

    if (!isRecording) {
      recordedChunksRef.current = []
      const options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 2500000 }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm'
      }

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current.ondataavailable = e => {
        recordedChunksRef.current.push(e.data)
      }
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } else {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `webcam-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        recordedChunksRef.current = []
      }
      setIsRecording(false)
    }
  }

  const handleSave = () => {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (isMirror) {
      ctx.scale(-1, 1)
      ctx.drawImage(videoRef.current, -canvas.width, 0)
    } else {
      ctx.drawImage(videoRef.current, 0, 0)
    }
    
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `screenshot-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const cameraLabel = cameras.find(c => c.deviceId === selectedCamera)?.label || 'Camera'

  return (
    <div className="app">
      <div className="header">
        <div className="logo">
          WebcamMicTest
        </div>
      </div>



      <div className="content">
        <div className="left-panel">
          <div className="metric-box">
            <div className="metric-label">STATUS</div>
            <div className="metric-value">{status}</div>
          </div>

          <div className="metric-box">
            <div className="metric-label">MIC LEVEL</div>
            <div className="level-bar-container">
              <div
                className="level-bar"
                style={{ width: `${(micLevel / 255) * 100}%` }}
              />
            </div>
            <div className="metric-value-small">{micLevel}</div>
          </div>

        <div className="toolbar-buttons">
          <button onClick={handleMirrorToggle} disabled={status !== 'working'} className="tool-btn">
            Mirror
          </button>
          <button onClick={handleRestart} disabled={status === 'requesting access'} className="tool-btn">
            Restart
          </button>
        </div>

          <div className="controls">
            <div className="control-group">
              <label htmlFor="camera-select">Camera</label>
              <select
                id="camera-select"
                value={selectedCamera}
                onChange={handleCameraChange}
                disabled={status === 'requesting access'}
              >
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="mic-select">Microphone</label>
              <select
                id="mic-select"
                value={selectedMic}
                onChange={handleMicChange}
                disabled={status === 'requesting access'}
              >
                {microphones.map(mic => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
        style={{ width: '80vw'}}
        className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={isMirror ? 'video mirror' : 'video'}
          />
        </div>
      </div>

      <div className="footer">
        <button
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleRecord}
          disabled={status !== 'working'}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording && <span className="record-pulse"></span>}
        </button>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={status !== 'working'}
          title="Save Screenshot"
        >
          <img src="/camera.png" alt="Camera" className="btn-icon" />
        </button>
      </div>
    </div>
  )
}
