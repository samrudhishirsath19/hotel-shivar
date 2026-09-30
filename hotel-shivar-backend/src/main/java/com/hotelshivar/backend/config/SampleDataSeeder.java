package com.hotelshivar.backend.config;

import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.entity.Room;
import com.hotelshivar.backend.entity.enums.RoomType;
import com.hotelshivar.backend.repository.MenuItemRepository;
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Puts the menu and rooms that used to be hard-coded on the website into the database,
 * but only when those tables are completely empty. After that the super admin manages them.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class SampleDataSeeder implements CommandLineRunner {

    private final MenuItemRepository menuItemRepository;
    private final RoomRepository roomRepository;

    @Override
    public void run(String... args) {
        if (menuItemRepository.count() == 0) {
            String u = "?w=500";
            String ph = "https://images.unsplash.com/";
            menuItemRepository.saveAll(List.of(
                    item("Misal Pav", "Breakfast", "veg", 120, "Spicy Kamshet special misal with pav & farsan.", ph + "photo-1606491956689-2ea866880c84" + u),
                    item("Cutting Chai", "Breakfast", "veg", 20, "Kadak Pimpri special cutting chai.", ph + "photo-1571934811356-5cc061b6821f" + u),
                    item("Samosa Chaat", "Starter", "veg", 150, "Crushed samosa with chole & chutney.", "/images/Samosa chat.jpg"),
                    item("Chicken Crispy", "Starter", "nonveg", 350, "Crispy fried chicken with spicy dip.", ph + "photo-1562967914-608f82629710" + u),
                    item("Paneer Tikka", "Veg Bhaji", "veg", 320, "Cottage cheese marinated in hung curd.", ph + "photo-1565557623262-b51c2513a641" + u),
                    item("Dal Makhani", "Veg Bhaji", "veg", 260, "Black lentils with butter.", "/images/Dal makhani.jpg"),
                    item("Veg Kolhapuri", "Veg Bhaji", "veg", 280, "Spicy mixed veg Kolhapuri style.", ph + "photo-1599487488170-d11ec9c172f0" + u),
                    item("Veg Biryani", "Veg Rice", "veg", 300, "Long grain basmati with veggies.", ph + "photo-1563379091339-03b21ab4a4f8" + u),
                    item("Jeera Rice", "Veg Rice", "veg", 200, "Steamed basmati with jeera tadka.", "/images/Jeera rice.jpg"),
                    item("Chapati / Roti", "Roti / Chapati", "veg", 30, "Soft phulka roti.", "/images/Soft phulka roti made with wheat.jpg"),
                    item("Butter Roti", "Roti / Chapati", "veg", 40, "Phulka roti with butter.", "/images/Phulka roti with butter topping.jpg"),
                    item("Butter Naan", "Roti / Chapati", "veg", 50, "Tandoor baked naan with butter.", "/images/Tandoor baked naan with butter.jpg"),
                    item("Butter Chicken", "Non-Veg Bhaji", "nonveg", 380, "Tandoori chicken in butter gravy.", "/images/Butter chicken.jpg"),
                    item("Hyderabadi Chicken Biryani", "Non-Veg Rice", "nonveg", 420, "Dum biryani with raita.", ph + "photo-1589302168068-964664d93dc0" + u),
                    item("Chocolate Brownie", "Dessert", "veg", 160, "Hot brownie with chocolate sauce.", ph + "photo-1606313564200-e75d5e30476c" + u),
                    item("Water Bottle 1L", "Water Bottle", "common", 20, "Bisleri Mineral Water 1 Litre.", ph + "photo-1548839140-29a749e1cf4d" + u)
            ));
            log.info("Default menu added");
        }

        if (roomRepository.count() == 0) {
            String ph = "https://images.unsplash.com/";
            String q = "?auto=format&fit=crop&w=800&q=70";
            roomRepository.saveAll(List.of(
                    room("101", "Standard Room", RoomType.STANDARD, 1800, "220 sq ft", 2, "Queen bed, Free Wi-Fi, LED TV, Hot water", ph + "photo-1631049307264-da0ec9d70304" + q),
                    room("102", "Deluxe Room", RoomType.DELUXE, 2800, "280 sq ft", 2, "King bed, Free Wi-Fi, Air conditioning, Tea/coffee maker", ph + "photo-1611892440504-42a792e24d32" + q),
                    room("103", "Valley View Room", RoomType.DOUBLE, 3800, "320 sq ft", 3, "Private balcony, Valley view, Air conditioning, Mini fridge", ph + "photo-1590490360182-c33d57733427" + q),
                    room("104", "Family Room", RoomType.FAMILY, 4800, "420 sq ft", 4, "2 double beds, Sofa seating, Breakfast included, Smart TV", ph + "photo-1566665797739-1674de7a421a" + q),
                    room("105", "Executive Suite", RoomType.SUITE, 6200, "500 sq ft", 3, "Separate living area, Bathtub, Breakfast included, Work desk", ph + "photo-1582719478250-c89cae4dc85b" + q),
                    room("106", "Presidential Suite", RoomType.SUITE, 8000, "750 sq ft", 4, "Panoramic view, Jacuzzi, All meals included, Butler service", ph + "photo-1578683010236-d716f9a3f461" + q)
            ));
            log.info("Default rooms added");
        }
    }

    private static MenuItem item(String name, String category, String type, int price, String description, String image) {
        return MenuItem.builder()
                .name(name).category(category).type(type)
                .price(BigDecimal.valueOf(price))
                .description(description).imageUrl(image)
                .available(true)
                .build();
    }

    private static Room room(String number, String name, RoomType type, int price, String size, int capacity,
                             String amenities, String image) {
        return Room.builder()
                .roomNumber(number).name(name).type(type)
                .pricePerNight(BigDecimal.valueOf(price))
                .size(size).capacity(capacity).amenities(amenities).imageUrl(image)
                .description(name)
                .available(true)
                .build();
    }
}
