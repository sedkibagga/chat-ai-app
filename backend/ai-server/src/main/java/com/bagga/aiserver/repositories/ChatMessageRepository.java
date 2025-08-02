package com.bagga.aiserver.repositories;

import com.bagga.aiserver.entities.ChatMessages;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessages, String> {
    List<ChatMessages> findByChatId(String chatId);
}
