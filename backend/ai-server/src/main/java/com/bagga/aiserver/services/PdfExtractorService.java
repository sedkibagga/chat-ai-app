package com.bagga.aiserver.services;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
@Slf4j
public class PdfExtractorService {

    public String extractTextFromPdf(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new IllegalArgumentException("Only PDF files are supported. Received: " + file.getContentType());
        }

        try (InputStream inputStream = file.getInputStream();
             PDDocument document = PDDocument.load(inputStream)) {

            validateDocument(document);
            return extractText(document);

        } catch (Exception e) {
            log.error("PDF extraction failed for file: {}", file.getOriginalFilename(), e);
            throw new IOException("PDF processing failed: " + e.getMessage(), e);
        }
    }

    private void validateDocument(PDDocument document) throws IOException {
        if (document.isEncrypted()) {
            throw new IOException("Encrypted PDF documents are not supported");
        }
        if (document.getNumberOfPages() == 0) {
            throw new IOException("PDF contains no pages");
        }
    }

    private String extractText(PDDocument document) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);
        stripper.setLineSeparator("\n");
        return stripper.getText(document);
    }
}
