# Hotel Shivar — Backend (Spring Boot)

REST API backend for the Hotel Shivar React frontend (Home, Rooms, Offers, Gallery,
Banquet, Contact, Location, etc.).

## Tech stack
- Java 17
- Spring Boot 3.3 (Web, Data JPA, Validation)
- Maven
- H2 in-memory DB by default (zero setup) — MySQL profile included for real use
- Lombok

## Opening the project in IntelliJ IDEA
1. **File → Open...** and select the `hotel-shivar-backend` folder (the one with `pom.xml`).
2. IntelliJ will detect it as a Maven project and download dependencies automatically.
   If it doesn't, right-click `pom.xml` → **Maven → Reload Project**.
3. Make sure IntelliJ is using **Java 17**: File → Project Structure → Project SDK.
4. Enable annotation processing for Lombok: Settings → Build, Execution, Deployment →
   Compiler → Annotation Processors → check "Enable annotation processing".
   (Also install the free "Lombok" plugin from Settings → Plugins if it's not already installed.)
5. Run `HotelShivarBackendApplication.java` (the class with `main`) — right-click it → Run.
6. The API starts on **http://localhost:8080**.
   Tables are created automatically; add data through the API.

You can also run it from a terminal:
```bash
./mvnw spring-boot:run
```

## Connecting the React (Vite) frontend
CORS is already configured (`config/CorsConfig.java`) to allow requests from
`http://localhost:5173`, which is Vite's default dev server port. In your frontend
code, call the API at `http://localhost:8080/api/...`, e.g.:
```js
fetch('http://localhost:8080/api/rooms')
  .then(res => res.json())
  .then(setRooms)
```

## Switching to MySQL
1. Install MySQL and make sure it's running.
2. Edit `src/main/resources/application-mysql.properties` with your username/password.
3. Activate the profile — either:
   - add `spring.profiles.active=mysql` to `application.properties`, or
   - add `-Dspring-boot.run.profiles=mysql` as a VM/program argument in your IntelliJ run configuration.
4. The database `hotel_shivar` and its tables are created automatically on first run.

## H2 console (default profile)
While running with H2, visit **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:file:./data/hotelshivar`
- User: `sa`, Password: *(blank)*

## API overview

All endpoints are under `/api`.

### Rooms — `/api/rooms`
| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms` | List all rooms (`?availableOnly=true` to filter) |
| GET | `/api/rooms/{id}` | Get one room |
| POST | `/api/rooms` | Create a room |
| PUT | `/api/rooms/{id}` | Update a room |
| DELETE | `/api/rooms/{id}` | Delete a room |

### Bookings — `/api/bookings`
| Method | Path | Description |
|---|---|---|
| GET | `/api/bookings` | List all bookings (`?email=` to filter by guest) |
| GET | `/api/bookings/{id}` | Get one booking |
| POST | `/api/bookings` | Create a booking (checks room availability & date overlap) |
| PATCH | `/api/bookings/{id}/status?status=CONFIRMED` | Update booking status |
| PATCH | `/api/bookings/{id}/cancel` | Cancel a booking |

Example booking request body:
```json
{
  "roomId": 1,
  "guestName": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "checkIn": "2026-10-10",
  "checkOut": "2026-10-12",
  "numberOfGuests": 2,
  "specialRequests": "Late check-in"
}
```

### Offers — `/api/offers`
GET (`?activeOnly=true`), GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}`

### Gallery — `/api/gallery`
GET (`?category=ROOMS`), POST, DELETE `/{id}`

### Contact — `/api/contact`
POST to submit the contact form, GET to list submissions (for an admin view).

### Banquet enquiries — `/api/banquet`
POST to submit an enquiry, GET to list submissions (for an admin view).

## Validation & errors
Invalid input returns `400` with a field-by-field error map. Not-found resources
return `404`. Booking conflicts (overlapping dates, unavailable room) return `409`.
All handled centrally in `exception/GlobalExceptionHandler.java`.

## Project structure
```
src/main/java/com/hotelshivar/backend/
├── config/        CORS configuration
├── controller/    REST controllers (one per resource)
├── dto/           Request/response payloads with validation
├── entity/        JPA entities (Room, Booking, Offer, GalleryImage, ContactMessage, BanquetEnquiry)
├── exception/     Custom exceptions + global handler
├── repository/    Spring Data JPA repositories
└── service/       Business logic
```

## Notes / next steps
This covers the core hotel-website features (rooms, bookings, offers, gallery,
contact and banquet enquiries) with no authentication yet. If you need an admin
login to protect the write/delete endpoints and the GET-all-messages endpoints,
add Spring Security with JWT — happy to add that as a follow-up.
