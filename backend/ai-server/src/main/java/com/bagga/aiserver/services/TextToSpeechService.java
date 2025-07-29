package com.bagga.aiserver.services;

import com.bagga.aiserver.clients.MaryTTSClient;
import org.springframework.stereotype.Service;

@Service
public class TextToSpeechService {

    private final MaryTTSClient maryTTSClient;

    public TextToSpeechService(MaryTTSClient maryTTSClient) {
        this.maryTTSClient = maryTTSClient;
    }

    public byte[] synthesizeSpeech(String text) {
        return maryTTSClient.synthesize(text, "TEXT", "AUDIO", "WAVE", "en_US");
    }
}
