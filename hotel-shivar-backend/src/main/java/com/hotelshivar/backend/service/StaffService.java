package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.StaffRequest;
import com.hotelshivar.backend.entity.StaffMember;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.StaffMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffMemberRepository repository;

    public List<StaffMember> list() {
        return repository.findAllByOrderByNameAsc();
    }

    public StaffMember create(StaffRequest r) {
        StaffMember s = new StaffMember();
        apply(s, r);
        return repository.save(s);
    }

    public StaffMember update(Long id, StaffRequest r) {
        StaffMember s = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with id: " + id));
        apply(s, r);
        return repository.save(s);
    }

    public void delete(Long id) {
        StaffMember s = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with id: " + id));
        repository.delete(s);
    }

    private void apply(StaffMember s, StaffRequest r) {
        s.setName(r.getName().trim());
        s.setJobTitle(r.getJobTitle().trim());
        s.setPhone(r.getPhone() == null || r.getPhone().isBlank() ? null : r.getPhone().trim());
        s.setJoinedOn(r.getJoinedOn());
        s.setActive(r.getActive() == null || r.getActive());
    }
}
