package com.passwordhunter.service;

import com.passwordhunter.model.SimulationHistory;
import com.passwordhunter.repository.HistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class HistoryService {
    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public SimulationHistory saveHistory(SimulationHistory history) {
        history.setUserId("anonymous");
        history.setDateTime(LocalDateTime.now());
        return historyRepository.save(history);
    }

    public Page<SimulationHistory> getHistory(int page, int limit, String search, String difficulty) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(50, limit),
                Sort.by(Sort.Direction.DESC, "dateTime")
        );

        Query query = new Query().with(pageable);
        query.addCriteria(Criteria.where("userId").is("anonymous"));

        if (search != null && !search.isEmpty()) {
            query.addCriteria(Criteria.where("maskedTarget").regex(search, "i"));
        }

        if (difficulty != null && !difficulty.isEmpty()) {
            query.addCriteria(Criteria.where("difficultyLabel").is(difficulty));
        }

        long total = mongoTemplate.count(query, SimulationHistory.class);
        var results = mongoTemplate.find(query, SimulationHistory.class);

        return new org.springframework.data.domain.PageImpl<>(results, pageable, total);
    }

    public void deleteHistory(String id) {
        historyRepository.deleteById(id);
    }

    public void deleteAllHistory() {
        historyRepository.deleteByUserId("anonymous");
    }

    public long getTotalHistoryCount() {
        return historyRepository.countByUserId("anonymous");
    }
}
