package com.bagga.aiserver.controller;

import com.bagga.aiserver.services.PdfExtractorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfExtractorService pdfExtractorService;

    @PostMapping(value = "/extract-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> extractText(@RequestParam("file") MultipartFile file) {
        try {
            String extractedText = pdfExtractorService.extractTextFromPdf(file);
            return ResponseEntity.ok(extractedText);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error extracting text: " + e.getMessage());
        }
    }
}
