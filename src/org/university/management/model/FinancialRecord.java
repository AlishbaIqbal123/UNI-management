package org.university.management.model;

import java.util.Date;

public class FinancialRecord {
    private String recordID;
    private String studentID;
    private Float amountPaid;
    private Float dueAmount;
    private Date transactionDate;

    public FinancialRecord() {
    }

    public FinancialRecord(String recordID, String studentID, Float amountPaid, Float dueAmount, Date transactionDate) {
        this.recordID = recordID;
        this.studentID = studentID;
        this.amountPaid = amountPaid;
        this.dueAmount = dueAmount;
        this.transactionDate = transactionDate;
    }

    public String getRecordID() {
        return recordID;
    }

    public void setRecordID(String recordID) {
        this.recordID = recordID;
    }

    public String getStudentID() {
        return studentID;
    }

    public void setStudentID(String studentID) {
        this.studentID = studentID;
    }

    public Float getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(Float amountPaid) {
        this.amountPaid = amountPaid;
    }

    public Float getDueAmount() {
        return dueAmount;
    }

    public void setDueAmount(Float dueAmount) {
        this.dueAmount = dueAmount;
    }

    public Date getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(Date transactionDate) {
        this.transactionDate = transactionDate;
    }

    public void recordPayment(Float payment) {
        this.amountPaid += payment;
        this.dueAmount -= payment;
        this.transactionDate = new Date();
        System.out.println("Payment of " + payment + " recorded for " + studentID);
    }

    public void generateInvoice() {
        System.out.println("Generating Invoice for Student " + studentID + ". Total Due: " + dueAmount);
    }
}
