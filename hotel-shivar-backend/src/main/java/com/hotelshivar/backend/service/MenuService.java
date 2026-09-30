package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.MenuItemRequest;
import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;

    /** What customers see. */
    public List<MenuItem> getAvailable() {
        return menuItemRepository.findByAvailableTrueOrderByCategoryAscNameAsc();
    }

    /** What the super admin sees (includes hidden items). */
    public List<MenuItem> getAll() {
        return menuItemRepository.findAllByOrderByCategoryAscNameAsc();
    }

    public MenuItem create(MenuItemRequest r) {
        MenuItem item = new MenuItem();
        apply(item, r);
        return menuItemRepository.save(item);
    }

    public MenuItem update(Long id, MenuItemRequest r) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        apply(item, r);
        return menuItemRepository.save(item);
    }

    public void delete(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        menuItemRepository.delete(item);
    }

    private void apply(MenuItem item, MenuItemRequest r) {
        item.setName(r.getName().trim());
        item.setCategory(r.getCategory().trim());
        item.setType(r.getType());
        item.setPrice(r.getPrice());
        item.setDescription(r.getDescription());
        item.setImageUrl(r.getImageUrl());
        item.setAvailable(r.getAvailable() == null || r.getAvailable());
    }
}
