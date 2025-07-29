package com.bagga.aiserver.repositories;

import com.bagga.aiserver.entities.ChatMessages;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessages, String> {
}
