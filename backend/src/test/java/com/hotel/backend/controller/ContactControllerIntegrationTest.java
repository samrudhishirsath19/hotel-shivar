package com.hotel.backend.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {"app.admin.api-key=test-key", "app.mail.enabled=false"})
class ContactControllerIntegrationTest {

    private static final String KEY_HEADER = "X-Admin-Key";
    private static final String KEY = "test-key";

    @Autowired
    private MockMvc mvc;

    /** Same shape the current frontend form sends. */
    private static final String FRONTEND_PAYLOAD = """
            {"name":"Asha Patil","phone":"9876543210","email":"Asha@Example.com",
             "subject":"Banquet / event enquiry","message":"  Need a hall for 150 guests.  "}
            """;

    private long submit() throws Exception {
        String body = mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(FRONTEND_PAYLOAD))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    @Test
    void publicSubmitAcceptsFrontendShapeAndNormalizes() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(FRONTEND_PAYLOAD))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/contact/")))
                .andExpect(jsonPath("$.fullName").value("Asha Patil"))
                .andExpect(jsonPath("$.email").value("asha@example.com"))
                .andExpect(jsonPath("$.subject").value("BANQUET"))
                .andExpect(jsonPath("$.message").value("Need a hall for 150 guests."))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void submitAcceptsSpecFieldNamesAndEnumName() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("""
                        {"fullName":"Ravi K","mobileNumber":"+91 9123456789","email":"ravi@example.com",
                         "category":"GENERAL_QUERY","message":"Is parking available?"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mobileNumber").value("+919123456789"))
                .andExpect(jsonPath("$.subject").value("GENERAL_QUERY"));
    }

    @Test
    void submitRejectsInvalidFields() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"","phone":"12345","email":"not-an-email","subject":"Room booking","message":""}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.mobileNumber").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.message").exists());
    }

    @Test
    void submitRejectsUnknownSubject() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"A B","phone":"9876543210","email":"a@b.com","subject":"Spa","message":"hi"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid subject 'Spa'")));
    }

    @Test
    void adminEndpointsRequireApiKey() throws Exception {
        long id = submit();
        mvc.perform(get("/api/contact")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/contact/" + id).header(KEY_HEADER, "wrong")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/contact/" + id)).andExpect(status().isUnauthorized());
    }

    @Test
    void listFiltersAndPaginates() throws Exception {
        long id = submit();
        mvc.perform(get("/api/contact").header(KEY_HEADER, KEY)
                        .param("category", "BANQUET").param("status", "PENDING").param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", hasItem((int) id)))
                .andExpect(jsonPath("$.size").value(100))
                .andExpect(jsonPath("$.page").value(0));

        mvc.perform(get("/api/contact").header(KEY_HEADER, KEY).param("status", "BOGUS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatusGetAndDelete() throws Exception {
        long id = submit();

        mvc.perform(patch("/api/contact/" + id + "/status").header(KEY_HEADER, KEY)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        mvc.perform(patch("/api/contact/" + id + "/status").header(KEY_HEADER, KEY)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/contact/" + id).header(KEY_HEADER, KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        mvc.perform(delete("/api/contact/" + id).header(KEY_HEADER, KEY)).andExpect(status().isNoContent());
        mvc.perform(get("/api/contact/" + id).header(KEY_HEADER, KEY)).andExpect(status().isNotFound());
    }

    @Test
    void corsPreflightFromFrontendIsAllowed() throws Exception {
        mvc.perform(options("/api/contact/1/status")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "content-type,x-admin-key"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
