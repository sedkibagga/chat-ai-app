package com.bagga.aiserver.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "marytts", url = "http://localhost:59125")
public interface MaryTTSClient {

    @GetMapping(value = "/process", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    byte[] synthesize(
            @RequestParam("INPUT_TEXT") String inputText,
            @RequestParam("INPUT_TYPE") String inputType,
            @RequestParam("OUTPUT_TYPE") String outputType,
            @RequestParam("AUDIO") String audioType,
            @RequestParam("LOCALE") String locale
    );
}
