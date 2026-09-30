package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.MenuItemRequest;
import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.MenuItemRepository;
import com.hotelshivar.backend.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

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
        requireUniqueName(r.getName(), null);
        MenuItem item = new MenuItem();
        apply(item, r);
        return menuItemRepository.save(item);
    }

    public MenuItem update(Long id, MenuItemRequest r) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        requireUniqueName(r.getName(), id);
        apply(item, r);
        return menuItemRepository.save(item);
    }

    public void delete(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        menuItemRepository.delete(item);
    }

    /** "Cutting Chai", "cutting chai" and "Cutting  Chai " are the same item - only one may exist. */
    private void requireUniqueName(String name, Long ownId) {
        String wanted = normalize(name);
        menuItemRepository.findAll().stream()
                .filter(m -> !m.getId().equals(ownId) && normalize(m.getName()).equals(wanted))
                .findFirst()
                .ifPresent(m -> {
                    throw new BadRequestException("\"" + m.getName() + "\" already exists in the menu. Please use a different name.");
                });
    }

    private static String cleanName(String name) {
        return name == null ? "" : name.trim().replaceAll(" +", " ");
    }

    private static String normalize(String name) {
        return cleanName(name).toLowerCase(Locale.ROOT);
    }

    private void apply(MenuItem item, MenuItemRequest r) {
        item.setName(cleanName(r.getName()));
        item.setCategory(r.getCategory().trim());
        item.setType(r.getType());
        item.setPrice(r.getPrice());
        item.setDescription(r.getDescription());
        item.setImageUrl(r.getImageUrl());
        item.setAvailable(r.getAvailable() == null || r.getAvailable());
    }
}
