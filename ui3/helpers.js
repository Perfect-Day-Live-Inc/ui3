import Queue from "./libs-src/Queue.src.js";

export function Clamp(i, min, max) {
  if (i < min) return min;
  if (i > max) return max;
  if (isNaN(i)) return min;
  return i;
}

export function StatusBlock(buf) {
  var offsetWrapper = { offset: 0 };
  this.bRec = ReadByte(buf, offsetWrapper);
  this.bMotion = ReadByte(buf, offsetWrapper);
  this.bCheckFPS = ReadByte(buf, offsetWrapper);
  this.bTriggered = ReadByte(buf, offsetWrapper);
  this.bSignalLost = ReadByte(buf, offsetWrapper);

  this.bPushError = ReadByte(buf, offsetWrapper);
  this.bFlashError = ReadByte(buf, offsetWrapper);
  this.bForceMovie = ReadByte(buf, offsetWrapper);

  this.bOther0 = ReadByte(buf, offsetWrapper);
  this.bOther1 = ReadByte(buf, offsetWrapper);

  this.fps = ReadInt32(buf, offsetWrapper); // in 100ths
  this.apeak = ReadInt32(buf, offsetWrapper); // out of 32767
  this.tpause = ReadInt32(buf, offsetWrapper);
}

///////////////////////////////////////////////////////////////
// Binary Reading /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
export function ReadByte(buf, offsetWrapper) {
  return buf[offsetWrapper.offset++];
}
export function ReadUInt16(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 2).getUint16(0, false);
  offsetWrapper.offset += 2;
  return v;
}
export function ReadUInt16LE(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 2).getUint16(0, true);
  offsetWrapper.offset += 2;
  return v;
}
export function ReadInt16(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 2).getInt16(0, false);
  offsetWrapper.offset += 2;
  return v;
}
export function ReadInt16LE(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 2).getInt16(0, true);
  offsetWrapper.offset += 2;
  return v;
}
export function ReadUInt32(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 4).getUint32(0, false);
  offsetWrapper.offset += 4;
  return v;
}
export function ReadUInt32LE(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 4).getUint32(0, true);
  offsetWrapper.offset += 4;
  return v;
}
export function ReadInt32(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 4).getInt32(0, false);
  offsetWrapper.offset += 4;
  return v;
}
export function ReadInt32LE(buf, offsetWrapper) {
  var v = new DataView(buf.buffer, offsetWrapper.offset, 4).getInt32(0, true);
  offsetWrapper.offset += 4;
  return v;
}
export function ReadUInt64(buf, offsetWrapper) {
  // This is a hack because JavaScript only has 64 bit doubles with 53 bit int precision.
  // If a number were to be higher than 2 ^ 53, this method would return the wrong value.
  var mostSignificant =
    (ReadUInt32(buf, offsetWrapper) & 0x001fffff) * 4294967296;
  var leastSignificant = ReadUInt32(buf, offsetWrapper);
  return mostSignificant + leastSignificant;
}
export function ReadUInt64LE(buf, offsetWrapper) {
  // This is a hack because JavaScript only has 64 bit doubles with 53 bit int precision.
  // If a number were to be higher than 2 ^ 53, this method would return the wrong value.
  var leastSignificant = ReadUInt32LE(buf, offsetWrapper);
  var mostSignificant =
    (ReadUInt32LE(buf, offsetWrapper) & 0x001fffff) * 4294967296;
  return mostSignificant + leastSignificant;
}
export function ReadASCII(buf, offsetWrapper, byteLength) {
  var v = ASCIIArrayToStr(
    new Uint8Array(buf.buffer, offsetWrapper.offset, byteLength)
  );
  offsetWrapper.offset += byteLength;
  return v;
}
export function ASCIIArrayToStr(arr) {
  var str = [];
  for (var i = 0; i < arr.length; i++) {
    str.push(String.fromCharCode(arr[i]));
  }
  return str.join("");
}
export function ReadSubArray(buf, offsetWrapper, byteLength) {
  var readBuf = new Uint8Array(byteLength);
  readBuf.set(
    buf.subarray(offsetWrapper.offset, (offsetWrapper.offset += byteLength))
  );
  return readBuf;
}
export function BITMAPINFOHEADER(buf) {
  var offsetWrapper = { offset: 0 };
  this.raw = buf;
  this.biSize = ReadUInt32LE(buf, offsetWrapper);
  this.biWidth = ReadInt32LE(buf, offsetWrapper); // Width in pixels
  this.biHeight = ReadInt32LE(buf, offsetWrapper); // Height in pixels
  this.biPlanes = ReadUInt16LE(buf, offsetWrapper); // Number of planes (always 1)
  this.biBitCount = ReadUInt16LE(buf, offsetWrapper); // Bits Per Pixel
  this.biCompression = ReadASCII(buf, offsetWrapper, 4); // "JPEG" or "MJPG" or "H264" (this can be ignored)
  this.biSizeImage = ReadUInt32LE(buf, offsetWrapper); // Image size in bytes
  this.biXPelsPerMeter = ReadInt32LE(buf, offsetWrapper);
  this.biYPelsPerMeter = ReadInt32LE(buf, offsetWrapper);
  this.biClrUsed = ReadUInt32LE(buf, offsetWrapper);
  this.biClrImportant = ReadUInt32LE(buf, offsetWrapper);
}
/** This is only loosely based on the WAVEFORMATEX structure. */
export function WAVEFORMATEX(buf) {
  this.raw = buf;
  var offsetWrapper = { offset: 0 };
  if (buf.length >= 14) {
    this.valid = true;
    this.wFormatTag = ReadUInt16LE(buf, offsetWrapper);
    this.nChannels = ReadUInt16LE(buf, offsetWrapper);
    this.nSamplesPerSec = ReadUInt32LE(buf, offsetWrapper);
    this.nAvgBytesPerSec = ReadUInt32LE(buf, offsetWrapper);
    this.nBlockAlign = ReadUInt16LE(buf, offsetWrapper);
    this.wBitsPerSample = 0;
    this.cbSize = 0;
    if (buf.length >= 18) {
      this.wBitsPerSample = ReadUInt16LE(buf, offsetWrapper);
      this.cbSize = ReadUInt16LE(buf, offsetWrapper);
    }
  } else this.valid = false;
}
export function BIVideoFrame(buf, metadata) {
  var self = this;
  this.meta = Object.assign({}, metadata);
  this.isVideo = true;
  this.frameData = buf;
  /** The percentage position of this frame in the clip, represented as an integer between 0 and 10000. */
  this.pos = metadata.pos;
  /** Millisecond timestamp since the start of the video stream. */
  this.time = metadata.time;
  /** Timestamp in milliseconds since the unix epoch (UTC). */
  this.utc = metadata.utc;
  /** Size in bytes of the frame data. */
  this.size = metadata.size;
  var cachedIsKeyframe = 0;
  this.isKeyframe = function () {
    if (cachedIsKeyframe === 1) return true;
    else if (cachedIsKeyframe === -1) return false;
    if (self.frameData && self.frameData.length > 0) {
      // The NALU type is the last 5 bits of the first byte after a start code.
      // This method will look in the first 1000 bytes to find a "VCL NALU" (types 1-5) and assume the
      // first found indicates the frame type.
      var end = Math.min(self.frameData.length, 1001) - 1;
      var zeroBytes = 0;
      for (var i = 0; i < end; i++) {
        if (self.frameData[i] === 0) zeroBytes++;
        else {
          if (zeroBytes >= 2 && self.frameData[i] === 1) {
            // Identified a start code.  Check the NALU type.
            var NALU_Type = self.frameData[i + 1] & 31; // 31 is 0b00011111
            if (NALU_Type == 5) {
              // This is a slice of a keyframe.
              cachedIsKeyframe = 1;
              return true;
            } else if (0 < NALU_Type && NALU_Type < 5) {
              // This is another frame type
              cachedIsKeyframe = -1;
              return false;
            }
          }
          zeroBytes = 0;
        }
      }
    }
    return false;
  };
}
export function BIAudioFrame(buf, formatHeader) {
  var self = this;
  this.isAudio = true;
  this.frameData = buf;
  this.format = formatHeader;
  this.isKeyframe = function () {
    return self.format.wFormatTag === 7;
  };
}
///////////////////////////////////////////////////////////////
// GhettoStream ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
/** A class which consumes Uint8Array objects and produces Uint8Array objects of whatever size you want by concatenating the inputs as needed. */
export function GhettoStream() {
  var self = this;
  var dataQueue = new Queue();
  var totalCachedBytes = 0;
  this.Count = function () {
    return totalCachedBytes;
  };
  /** Writes the specified Uint8Array to the stream so it can be read later. */
  this.Write = function (newArray) {
    dataQueue.enqueue(newArray);
    totalCachedBytes += newArray.length;
  };
  /** Reads the specified number of bytes from the stream, returning null if not enough bytes are available yet. */
  this.Read = function (byteCount) {
    if (byteCount > totalCachedBytes) return null;

    var readBuf = new Uint8Array(byteCount);
    var alreadyRead = 0;
    var remainingToRead = byteCount - alreadyRead;

    while (remainingToRead > 0) {
      var chunk = dataQueue.peek();
      if (chunk.length > remainingToRead) {
        // This chunk will have left-overs.
        readBuf.set(chunk.subarray(0, remainingToRead), alreadyRead);
        dataQueue.replaceFront(chunk.subarray(remainingToRead));
        alreadyRead += remainingToRead;
      } else {
        // This entire chunk goes into the output buffer.
        readBuf.set(chunk, alreadyRead);
        dataQueue.dequeue();
        alreadyRead += chunk.length;
      }
      remainingToRead = byteCount - alreadyRead;
    }
    totalCachedBytes -= readBuf.length;
    return readBuf;
  };
}

///////////////////////////////////////////////////////////////
// Audio Decoder: mu-law //////////////////////////////////////
///////////////////////////////////////////////////////////////
export function MuLawDecoder() {
  var decHelper = [
    -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956, -23932,
    -22908, -21884, -20860, -19836, -18812, -17788, -16764, -15996, -15484,
    -14972, -14460, -13948, -13436, -12924, -12412, -11900, -11388, -10876,
    -10364, -9852, -9340, -8828, -8316, -7932, -7676, -7420, -7164, -6908,
    -6652, -6396, -6140, -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
    -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004, -2876, -2748, -2620,
    -2492, -2364, -2236, -2108, -1980, -1884, -1820, -1756, -1692, -1628, -1564,
    -1500, -1436, -1372, -1308, -1244, -1180, -1116, -1052, -988, -924, -876,
    -844, -812, -780, -748, -716, -684, -652, -620, -588, -556, -524, -492,
    -460, -428, -396, -372, -356, -340, -324, -308, -292, -276, -260, -244,
    -228, -212, -196, -180, -164, -148, -132, -120, -112, -104, -96, -88, -80,
    -72, -64, -56, -48, -40, -32, -24, -16, -8, -1, 32124, 31100, 30076, 29052,
    28028, 27004, 25980, 24956, 23932, 22908, 21884, 20860, 19836, 18812, 17788,
    16764, 15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412, 11900, 11388,
    10876, 10364, 9852, 9340, 8828, 8316, 7932, 7676, 7420, 7164, 6908, 6652,
    6396, 6140, 5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092, 3900, 3772,
    3644, 3516, 3388, 3260, 3132, 3004, 2876, 2748, 2620, 2492, 2364, 2236,
    2108, 1980, 1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436, 1372, 1308,
    1244, 1180, 1116, 1052, 988, 924, 876, 844, 812, 780, 748, 716, 684, 652,
    620, 588, 556, 524, 492, 460, 428, 396, 372, 356, 340, 324, 308, 292, 276,
    260, 244, 228, 212, 196, 180, 164, 148, 132, 120, 112, 104, 96, 88, 80, 72,
    64, 56, 48, 40, 32, 24, 16, 8, 0,
  ];
  this.DecodeUint8ArrayToInt16Array = function (encoded) {
    var decoded = new Int16Array(encoded.length);
    for (var i = 0; i < encoded.length; i++) decoded[i] = decHelper[encoded[i]];
    return decoded;
  };
  this.DecodeUint8ArrayToFloat32Array = function (encoded) {
    var decoded = new Float32Array(encoded.length);
    for (var i = 0; i < encoded.length; i++)
      decoded[i] = decHelper[encoded[i]] / 32768;
    return decoded;
  };
}

///////////////////////////////////////////////////////////////
// Audio Filter (silences crackle at frame boundaries) ////////
// Not recommended because not all audio waveforms are ////////
// centered on zero.                                   ////////
///////////////////////////////////////////////////////////////
function AudioEdgeFilterRaw(audio32) {
  var wasPositive = audio32[0] > 0;

  for (var i = 0; i < audio32.length; i += 1) {
    if ((wasPositive && audio32[i] < 0) || (!wasPositive && audio32[i] > 0))
      break;

    audio32[i] = 0;
  }

  wasPositive = audio32[audio32.length - 1] > 0;

  for (var i = audio32.length - 1; i > 0; i -= 1) {
    if ((wasPositive && audio32[i] < 0) || (!wasPositive && audio32[i] > 0))
      break;

    audio32[i] = 0;
  }

  return audio32;
}
///////////////////////////////////////////////////////////////
// Audio Playback /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
export function PcmAudioPlayer(
  settings,
  audio_playback_supported = true,
  DoAudioDecodingFallback,
  volumeIconHelper,
  ui3AudioVisualizer,
  volumeSlider,
  videoPlayer,
  mqttClient,
  inputRequiredOverlay,
  toaster,
  debug_doEdgeFilter
) {
  var self = this;
  var supported = audio_playback_supported;
  var AudioContext;
  if (supported)
    AudioContext = window.AudioContext || window.webkitAudioContext;
  else AudioContext = FakeAudioContext_Dummy;

  var context;
  var volumeController;
  var currentVolume = -1; // 0 to 1
  var nextTime = 0; // This is the playback time in seconds at which we run out (or ran out) of audio.
  var audioStopTimeout = null;
  var suppressAudioVolumeSave = false;
  var suspended = true;
  var pendingBufferQueue = new Queue();
  //context.onstatechange = function ()
  //{
  //	switch (context.state)
  //	{
  //		case "suspended":
  //			break;
  //		case "running":
  //			break;
  //		case "closed":
  //			volumeIconHelper.setColorIdle();
  //			break;
  //	}
  //};
  var decoderState = {
    lastReceivedAudioIndex: -1,
    nextPlayAudioIndex: 0,
    buffers: [],
    startTime: -1,
  };
  this.DecodeAndPlayAudioData = function (
    audioData,
    sampleRate,
    setAudioCodecString
  ) {
    if (!supported) return;
    if (sampleRate !== context.sampleRate) NewContext(sampleRate);

    // detect decoder stall
    if (
      decoderState.nextPlayAudioIndex <= 1 &&
      decoderState.lastReceivedAudioIndex > 20 &&
      decoderState.startTime > -1 &&
      performance.now() - decoderState.startTime > 5000
    ) {
      console.log("FLAC decoder stall detected.", decoderState);
      DoAudioDecodingFallback();
      return;
    }

    if (decoderState.startTime === -1)
      decoderState.startTime = performance.now();
    decoderState.lastReceivedAudioIndex++;
    var myIndex = decoderState.lastReceivedAudioIndex;
    context.decodeAudioData(
      audioData.buffer,
      function (audioBuffer) {
        setAudioCodecString(
          "flac " + audioBuffer.numberOfChannels + "ch " + sampleRate + "hz"
        );
        decoderState.buffers.push({ buffer: audioBuffer, index: myIndex });
        PlayDecodedAudio();
      },
      function () {
        console.log("Audio decode FAIL", arguments);
        setAudioCodecString("flac (cannot decode)");
        DoAudioDecodingFallback();
      }
    );
  };
  var PlayDecodedAudio = function () {
    // Plays the decoded audio buffers in the correct order.
    for (var i = 0; i < decoderState.buffers.length; i++) {
      if (decoderState.buffers[i].index === decoderState.nextPlayAudioIndex) {
        decoderState.nextPlayAudioIndex++;
        var audioBuffer = decoderState.buffers[i].buffer;
        decoderState.buffers.splice(i, 1);
        var channels = [];
        for (var i = 0; i < audioBuffer.numberOfChannels; i++)
          channels.push(audioBuffer.getChannelData(i));
        self.AcceptBuffer(channels, audioBuffer.sampleRate);
        PlayDecodedAudio(); // Recursively call in case the next buffer was already added out of order.
        return;
      }
    }
  };
  /**
   * Queues a Float32Array of raw audio data (range -1.0 to 1.0) for playback.
   * @param {Array} audio32 Array of audio channels.  Each channel is a Float32Array of raw audio data (range -1.0 to 1.0)
   * @param {Number} sampleRate Sample rate (hz)
   */
  this.AcceptBuffer = function (audio32, sampleRate) {
    if (!supported) return;
    if (sampleRate !== context.sampleRate) NewContext(sampleRate);
    if (suspended) {
      suspended = false;
      context.resume();
    }
    if (debug_doEdgeFilter) AudioEdgeFilterRaw(audio32[0]);

    var buffer = context.createBuffer(
      audio32.length,
      audio32[0].length,
      sampleRate
    );
    for (var i = 0; i < audio32.length; i++)
      buffer.copyToChannel(audio32[i], i);

    var bufferSource = context.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(volumeController);
    volumeController.connect(context.destination);

    var currentTime = context.currentTime;
    if (nextTime == 0) nextTime = currentTime + 0.2; // Add the initial audio delay in seconds.

    var duration = bufferSource.buffer.duration;
    var offset = currentTime - nextTime;
    var maxDelayMs = settings
      ? Clamp(parseInt(settings.ui3_audio_buffer_ms) / 1000, 0, 5000)
      : 1000;
    if (offset > 0) {
      // This frame is late. Play it immediately.
      nextTime = currentTime;
      //console.log("Audio frame is LATE by", offset);
      offset = 0;
    } else if (offset < -1 * maxDelayMs) {
      CheckUserInputRequirement();
      // We have received so many frames that we are queued at least 700ms ahead. Drop this frame.
      if (managedUserInputRequirement)
        console.log(
          "Audio buffer is overfull at " +
            currentTime.toFixed(6) +
            " with " +
            Math.abs(offset.toFixed(6)) +
            " seconds queued. Dropping audio frame to keep delay from growing too high."
        );
      return;
    }
    pendingBufferQueue.enqueue(bufferSource);
    bufferSource.onended = DequeueBufferSource;
    if (volumeIconHelper) {
      volumeIconHelper.setEnabled(true);
      volumeIconHelper.setColorPlaying();
    }

    bufferSource.start(nextTime);
    //bufferSource.stop(nextTime + duration);
    nextTime += duration;

    if (ui3AudioVisualizer)
      ui3AudioVisualizer.AcceptBuffer(
        audio32,
        sampleRate,
        currentTime,
        nextTime,
        duration
      );
  };
  var DequeueBufferSource = function () {
    pendingBufferQueue.dequeue();
    if (volumeIconHelper && pendingBufferQueue.isEmpty())
      volumeIconHelper.setColorLoading();
  };
  this.GetBufferedMs = function () {
    if (!supported) return 0;
    var buffered = nextTime - context.currentTime;
    if (buffered < 0) return 0;
    return buffered * 1000;
  };
  this.GetCurrentTime = function () {
    if (!supported) return 0;
    return context.currentTime;
  };
  this.SuppressAudioVolumeSave = function () {
    return suppressAudioVolumeSave;
  };
  this.SetAudioVolumeFromSettings = function (volume) {
    if (!supported) return;
    var effectiveVolume = settings
      ? volume || settings.ui3_audioMute == "1"
        ? 0
        : parseFloat(settings.ui3_audioVolume)
      : volume;
    suppressAudioVolumeSave = true;
    setTimeout(function () {
      suppressAudioVolumeSave = false;
    }, 0);
    if (volumeSlider) {
      volumeSlider.setPosition(effectiveVolume);
    } else {
      this.SetVolume(effectiveVolume);
    }
  };
  this.SetVolume = function (newVolume) {
    if (!supported) return;
    clearMuteStopTimeout();
    currentVolume = newVolume;
    newVolume = Clamp(newVolume, 0, 1);
    volumeController.gain.value = newVolume * newVolume; // Don't use setValueAtTime method because it has issues (UI3-v17 + Chrome 66 was affected)
    if (volumeIconHelper) volumeIconHelper.setIconForVolume(newVolume);
    if (newVolume == 0)
      audioStopTimeout = setTimeout(toggleAudioPlayback, 1000);
    else toggleAudioPlayback();
    if (mqttClient) mqttClient.volumeChanged();
  };
  this.GetVolume = function () {
    if (!supported) return 0;
    return Clamp(Math.sqrt(volumeController.gain.value), 0, 1);
  };
  this.Pause = function () {
    if (!supported) return;
    context.suspend();
  };
  this.Resume = function () {
    if (!supported) return;
    context.resume();
  };
  var clearMuteStopTimeout = function () {
    if (audioStopTimeout != null) {
      clearTimeout(audioStopTimeout);
      audioStopTimeout = null;
    }
  };
  var toggleAudioPlayback = function () {
    if (!supported) return;
    clearMuteStopTimeout();
    if (videoPlayer) videoPlayer.AudioToggleNotify(self.AudioEnabled());
  };
  var startedUserInputRequirement = false;
  var managedUserInputRequirement = false;
  var userInputRequirementEvents = ["keydown", "click", "mousedown"];
  var CheckUserInputRequirement = function () {
    if (
      !startedUserInputRequirement &&
      context.currentTime === 0 &&
      !suspended &&
      context.state === "suspended"
    ) {
      startedUserInputRequirement = true;
      if (settings.ui3_web_audio_autoplay_warning === "1")
        inputRequiredOverlay.Show("audio player", HandleUserInputRequirement);
      for (var i = 0; i < userInputRequirementEvents.length; i++)
        document.addEventListener(
          userInputRequirementEvents[i],
          HandleUserInputRequirement
        );
      if (volumeIconHelper) volumeIconHelper.setColorError();
    }
  };
  var HandleUserInputRequirement = function (e) {
    managedUserInputRequirement = true;
    for (var i = 0; i < userInputRequirementEvents.length; i++)
      document.removeEventListener(
        userInputRequirementEvents[i],
        HandleUserInputRequirement
      );
    self.Reset();
  };
  this.AudioEnabled = function () {
    return self.GetVolume() > 0;
  };
  this.Reset = function () {
    if (!supported) return;
    if (!suspended) {
      suspended = true;
      context.suspend();
      nextTime = 0;
    }
    while (!pendingBufferQueue.isEmpty()) {
      var buffer = pendingBufferQueue.dequeue();
      buffer.onended = function () {};
      buffer.stop();
    }
  };
  var NewContext = function (sampleRate) {
    if (context) {
      context.suspend();
      if (typeof context.close === "function") {
        try {
          context.close();
        } catch (ex) {
          toaster.Error(ex);
        }
      }
    }
    // We must specify the correct sample rate during AudioContext construction,
    // or else FLAC will be resampled by the decoder in such a way that it
    // introduces a static pop after every audio buffer.
    if (sampleRate) context = new AudioContext({ sampleRate: sampleRate });
    else context = new AudioContext();
    context.suspend();
    volumeController = context.createGain();
    if (currentVolume >= 0) self.SetVolume(currentVolume);
    suspended = true;
    if (ui3AudioVisualizer) ui3AudioVisualizer.Reset();
  };
  NewContext();
}
/** This object provides a fake implementation to prevent script errors when a real implementation is unavailable. */
function FakeAudioContext_Dummy() {
  this.isFakeAudioContext = true;
  this.createGain = function () {};
  this.onstatechange = null;
  this.createBuffer = function () {};
  this.createBufferSource = function () {};
  this.destination = null;
  this.currentTime = 0;
  this.suspend = function () {};
  this.resume = function () {};
  this.close = function () {};
}
