package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.PurchaseRequest;
import com.hotelshivar.backend.entity.InventoryItem;
import com.hotelshivar.backend.entity.Purchase;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.InventoryItemRepository;
import com.hotelshivar.backend.repository.PurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final InventoryItemRepository inventoryRepository;

    @Transactional(readOnly = true)
    public List<Purchase> list(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(29);
        if (start.isAfter(end)) {
            throw new BadRequestException("'From' date must not be after 'To' date");
        }
        if (ChronoUnit.DAYS.between(start, end) > 366) {
            throw new BadRequestException("Please choose a range of at most one year");
        }
        return purchaseRepository.findByPurchasedOnBetweenOrderByPurchasedOnDescIdDesc(start, end);
    }

    /** Saves the purchase and adds the quantity to the stock. */
    @Transactional
    public Purchase create(PurchaseRequest r) {
        InventoryItem item = inventoryRepository.findById(r.getInventoryItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + r.getInventoryItemId()));

        item.setQuantity(item.getQuantity().add(r.getQuantity()));
        inventoryRepository.save(item);

        Purchase purchase = Purchase.builder()
                .inventoryItemId(item.getId())
                .itemName(item.getName())
                .unit(item.getUnit())
                .supplier(r.getSupplier() == null || r.getSupplier().isBlank() ? null : r.getSupplier().trim())
                .quantity(r.getQuantity())
                .unitCost(r.getUnitCost())
                .totalCost(r.getQuantity().multiply(r.getUnitCost()).setScale(2, RoundingMode.HALF_UP))
                .purchasedOn(r.getPurchasedOn() != null ? r.getPurchasedOn() : LocalDate.now())
                .note(r.getNote())
                .build();
        return purchaseRepository.save(purchase);
    }

    /** Deleting a purchase takes its quantity back out of the stock (never below 0). */
    @Transactional
    public void delete(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));
        if (purchase.getInventoryItemId() != null) {
            inventoryRepository.findById(purchase.getInventoryItemId()).ifPresent(item -> {
                BigDecimal left = item.getQuantity().subtract(purchase.getQuantity());
                item.setQuantity(left.signum() < 0 ? BigDecimal.ZERO : left);
                inventoryRepository.save(item);
            });
        }
        purchaseRepository.delete(purchase);
    }
}
