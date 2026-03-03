
class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0];
            // Convert Float32 to Int16
            const pcmData = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
            }
            this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
