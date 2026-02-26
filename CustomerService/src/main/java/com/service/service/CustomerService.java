package com.service.service;

import com.service.dto.request.CustomerRequest;
import com.service.dto.response.CreditHistoryResponse;
import com.service.dto.response.CustomerResponse;
import com.service.entity.CreditHistory;
import com.service.entity.Customer;
import com.service.entity.CustomerDocument;
import com.service.event.CustomerCreatedEvent;
import com.service.event.CustomerEventProducer;
import com.service.repository.CreditHistoryRepository;
import com.service.repository.CustomerDocumentRepository;
import com.service.repository.CustomerRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CreditHistoryRepository creditHistoryRepository;
    private final CustomerDocumentRepository customerDocumentRepository;
    private final CustomerEventProducer customerEventProducer;

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (customerRepository.existsByDni(request.getDni())) {
            throw new RuntimeException("DNI ya existe");
        }

        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email ya existe");
        }

        Customer customer = mapToEntity(request);
        customer = customerRepository.save(customer);

        // Crear historial crediticio inicial
        CreditHistory creditHistory = new CreditHistory();
        creditHistory.setCustomerId(customer.getId());
        creditHistory.setCreditScore(300); // Score inicial
        creditHistory.setTotalDebt(BigDecimal.ZERO);
        creditHistoryRepository.save(creditHistory);

        // Crear documento inicial (por ejemplo DNI)
        CustomerDocument document = new CustomerDocument();
        document.setCustomerId(customer.getId());
        document.setDocumentType(request.getDocumentType());
        document.setDocumentUrl("PENDIENTE"); //
        document.setVerified(false);
        customerDocumentRepository.save(document);

        customerEventProducer.sendCustomerCreated(
                new CustomerCreatedEvent(customer.getId(), customer.getEmail())
        );

        return mapToResponse(customer);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return mapToResponse(customer);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByDni(String dni) {
        Customer customer = customerRepository.findByDni(dni)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return mapToResponse(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setMonthlyIncome(request.getMonthlyIncome());
        customer.setWorkExperienceYears(request.getWorkExperienceYears());
        customer.setOccupation(request.getOccupation());
        customer.setEmployerName(request.getEmployerName());

        customer = customerRepository.save(customer);
        return mapToResponse(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new RuntimeException("Cliente no encontrado");
        }
        customerRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CreditHistoryResponse getCreditHistory(Long customerId) {
        CreditHistory history = creditHistoryRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("Historial crediticio no encontrado"));

        CreditHistoryResponse response = new CreditHistoryResponse();
        response.setCustomerId(history.getCustomerId());
        response.setCreditScore(history.getCreditScore());
        response.setTotalDebt(history.getTotalDebt());
        response.setActiveLoans(history.getActiveLoans());
        response.setCompletedLoans(history.getCompletedLoans());
        response.setDefaultedLoans(history.getDefaultedLoans());

        return response;
    }

    private Customer mapToEntity(CustomerRequest request) {
        Customer customer = new Customer();
        customer.setDni(request.getDni());
        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setCountry(request.getCountry());
        customer.setMonthlyIncome(request.getMonthlyIncome());
        customer.setWorkExperienceYears(request.getWorkExperienceYears());
        customer.setOccupation(request.getOccupation());
        customer.setEmployerName(request.getEmployerName());
        return customer;
    }

    private CustomerResponse mapToResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setDni(customer.getDni());
        response.setFirstName(customer.getFirstName());
        response.setLastName(customer.getLastName());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setDateOfBirth(customer.getDateOfBirth());
        response.setAddress(customer.getAddress());
        response.setCity(customer.getCity());
        response.setCountry(customer.getCountry());
        response.setMonthlyIncome(customer.getMonthlyIncome());
        response.setWorkExperienceYears(customer.getWorkExperienceYears());
        response.setOccupation(customer.getOccupation());
        response.setEmployerName(customer.getEmployerName());
        response.setCreatedAt(customer.getCreatedAt());
        response.setUpdatedAt(customer.getUpdatedAt());
        return response;
    }
}
