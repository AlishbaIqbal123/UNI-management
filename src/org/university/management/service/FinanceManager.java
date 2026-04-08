package org.university.management.service;

import org.university.management.model.*;
import java.util.*;

public class FinanceManager {
    private List<FinancialRecord> financialRecords = new ArrayList<>();

    public void addRecord(FinancialRecord record) {
        financialRecords.add(record);
    }

    public void generateStudentInvoice(String studentId) {
        FinancialRecord record = findFinanceRecordByStudentId(studentId);
        if (record != null) {
            record.generateInvoice();
        } else {
            System.out.println("No financial record found for student " + studentId);
        }
    }

    public FinancialRecord findFinanceRecordByStudentId(String studentId) {
        return financialRecords.stream()
                .filter(r -> r.getStudentID().equals(studentId))
                .findFirst()
                .orElse(null);
    }

    public int calculateFee(Student s) {
        return s.getCredits() * FEE_PER_CREDIT;
    }

    private static final int FEE_PER_CREDIT = 1000;
}
