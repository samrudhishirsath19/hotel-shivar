package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.InventoryIssueRequest;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.InventoryIssue;
import com.hotelshivar.backend.entity.InventoryItem;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.InventoryIssueRepository;
import com.hotelshivar.backend.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** Inventory Out: stock issued from the store. Saving takes the quantity out of stock; deleting puts it back. */
@Service
@RequiredArgsConstructor
public class InventoryIssueService {

    private final InventoryIssueRepository issueRepository;
    private final InventoryItemRepository inventoryRepository;

    @Transactional(readOnly = true)
    public List<InventoryIssue> list(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(29);
        if (start.isAfter(end)) {
            throw new BadRequestException("'From' date must not be after 'To' date");
        }
        if (ChronoUnit.DAYS.between(start, end) > 366) {
            throw new BadRequestException("Please choose a range of at most one year");
        }
        return issueRepository.findByIssuedOnBetweenOrderByIssuedOnDescIdDesc(start, end);
    }

    @Transactional
    public InventoryIssue create(InventoryIssueRequest r, AdminUser by) {
        InventoryItem item = inventoryRepository.findById(r.getInventoryItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + r.getInventoryItemId()));
        LocalDate day = r.getIssuedOn() != null ? r.getIssuedOn() : LocalDate.now();
        if (day.isAfter(LocalDate.now())) {
            throw new BadRequestException("The date cannot be in the future");
        }
        if (r.getQuantity().compareTo(item.getQuantity()) > 0) {
            throw new BadRequestException("Only " + item.getQuantity().stripTrailingZeros().toPlainString() + " " + item.getUnit()
                    + " of " + item.getName() + " in stock - cannot issue " + r.getQuantity().stripTrailingZeros().toPlainString());
        }
        item.setQuantity(item.getQuantity().subtract(r.getQuantity()));
        inventoryRepository.save(item);

        return issueRepository.save(InventoryIssue.builder()
                .inventoryItemId(item.getId())
                .itemName(item.getName())
                .unit(item.getUnit())
                .quantity(r.getQuantity())
                .issuedOn(day)
                .issuedBy(r.getIssuedBy())
                .issuedTo(blankToNull(r.getIssuedTo()))
                .note(blankToNull(r.getNote()))
                .recordedBy(by != null ? by.getName() : null)
                .build());
    }

    /** A wrong entry: the quantity goes back into stock. */
    @Transactional
    public void delete(Long id) {
        InventoryIssue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory Out entry not found with id: " + id));
        if (issue.getInventoryItemId() != null) {
            inventoryRepository.findById(issue.getInventoryItemId()).ifPresent(item -> {
                item.setQuantity(item.getQuantity().add(issue.getQuantity()));
                inventoryRepository.save(item);
            });
        }
        issueRepository.delete(issue);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim().replaceAll("\\s+", " ");
    }
}
