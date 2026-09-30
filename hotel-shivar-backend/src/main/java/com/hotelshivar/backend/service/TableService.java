package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.TableRequest;
import com.hotelshivar.backend.entity.RestaurantTable;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.entity.enums.TableStatus;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import com.hotelshivar.backend.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Restaurant tables: the super admin adds, edits and deletes them. */
@Service
@RequiredArgsConstructor
public class TableService {

    private final RestaurantTableRepository tableRepository;
    private final FoodOrderRepository orderRepository;

    public List<RestaurantTable> list() {
        return tableRepository.findAllByOrderByTableNumberAsc();
    }

    @Transactional
    public RestaurantTable create(TableRequest r) {
        if (tableRepository.findByTableNumber(r.getTableNumber()).isPresent()) {
            throw new BadRequestException("Table " + r.getTableNumber() + " already exists. Use a different table number.");
        }
        return tableRepository.save(RestaurantTable.builder()
                .tableNumber(r.getTableNumber())
                .capacity(r.getCapacity())
                .status(r.getStatus() != null ? r.getStatus() : TableStatus.AVAILABLE)
                .build());
    }

    @Transactional
    public RestaurantTable update(Long id, TableRequest r) {
        RestaurantTable t = get(id);
        if (!t.getTableNumber().equals(r.getTableNumber())) {
            tableRepository.findByTableNumber(r.getTableNumber()).ifPresent(other -> {
                throw new BadRequestException("Table " + r.getTableNumber() + " already exists. Use a different table number.");
            });
            if (hasRunningOrder(t.getTableNumber())) {
                throw new BadRequestException("Table " + t.getTableNumber()
                        + " has a running order. Finish or cancel it before changing the table number.");
            }
        }
        t.setTableNumber(r.getTableNumber());
        t.setCapacity(r.getCapacity());
        if (r.getStatus() != null) {
            t.setStatus(r.getStatus());
        }
        return tableRepository.save(t);
    }

    /** Only the status (available / reserved / out of service) - the "Table status" permission. */
    @Transactional
    public RestaurantTable setStatus(Long id, TableStatus status) {
        if (status == null) {
            throw new BadRequestException("Choose a status");
        }
        RestaurantTable t = get(id);
        t.setStatus(status);
        return tableRepository.save(t);
    }

    @Transactional
    public void delete(Long id) {
        RestaurantTable t = get(id);
        if (hasRunningOrder(t.getTableNumber())) {
            throw new BadRequestException("Table " + t.getTableNumber()
                    + " has a running order. Finish or cancel it before deleting the table.");
        }
        tableRepository.delete(t);
    }

    /** Throws if new items may not be ordered on this table. */
    public RestaurantTable requireUsable(int number) {
        RestaurantTable t = tableRepository.findByTableNumber(number)
                .orElseThrow(() -> new BadRequestException("Table " + number + " does not exist"));
        if (t.getStatus() == TableStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Table " + number + " is out of service");
        }
        return t;
    }

    private boolean hasRunningOrder(Integer number) {
        return orderRepository.findFirstByOrderTypeAndTableNumberAndStatus(OrderType.TABLE, number, OrderStatus.OPEN).isPresent();
    }

    private RestaurantTable get(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));
    }
}
