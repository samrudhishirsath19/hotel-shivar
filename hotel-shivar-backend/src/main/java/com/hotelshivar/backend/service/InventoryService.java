package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.InventoryRequest;
import com.hotelshivar.backend.entity.InventoryItem;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository repository;

    public List<InventoryItem> list() {
        return repository.findAllByOrderByNameAsc();
    }

    public InventoryItem create(InventoryRequest r) {
        String name = r.getName().trim();
        if (repository.findByNameIgnoreCase(name).isPresent()) {
            throw new BadRequestException("An inventory item named \"" + name + "\" already exists");
        }
        InventoryItem item = new InventoryItem();
        apply(item, r);
        return repository.save(item);
    }

    public InventoryItem update(Long id, InventoryRequest r) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + id));
        String name = r.getName().trim();
        repository.findByNameIgnoreCase(name).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new BadRequestException("An inventory item named \"" + name + "\" already exists");
            }
        });
        apply(item, r);
        return repository.save(item);
    }

    public void delete(Long id) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + id));
        repository.delete(item);
    }

    private void apply(InventoryItem item, InventoryRequest r) {
        item.setName(r.getName().trim());
        item.setUnit(r.getUnit().trim());
        item.setQuantity(r.getQuantity());
        item.setMinLevel(r.getMinLevel() == null ? BigDecimal.ZERO : r.getMinLevel());
    }
}
