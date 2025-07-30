package com.bagga.aiserver.controller;

import com.bagga.aiserver.services.TextToSpeechService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
public class TextToSpeechController {

    private final TextToSpeechService ttsService;

    public TextToSpeechController(TextToSpeechService ttsService) {
        this.ttsService = ttsService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE, produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> postSpeech(@RequestParam String text) {
        byte[] audioBytes = ttsService.synthesizeSpeech(text);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=speech.wav")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(audioBytes);
    }

}
