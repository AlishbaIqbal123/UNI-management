package org.university.management.model;

import java.util.Date;

public class Registration {
    private String registrationID;
    private String studentID;
    private String courseID;
    private String status;
    private Date registrationDate;

    public Registration() {
    }

    public Registration(String registrationID, String studentID, String courseID, String status, Date registrationDate) {
        this.registrationID = registrationID;
        this.studentID = studentID;
        this.courseID = courseID;
        this.status = status;
        this.registrationDate = registrationDate;
    }

    public String getRegistrationID() {
        return registrationID;
    }

    public void setRegistrationID(String registrationID) {
        this.registrationID = registrationID;
    }

    public String getStudentID() {
        return studentID;
    }

    public void setStudentID(String studentID) {
        this.studentID = studentID;
    }

    public String getCourseID() {
        return courseID;
    }

    public void setCourseID(String courseID) {
        this.courseID = courseID;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Date registrationDate) {
        this.registrationDate = registrationDate;
    }

    public void confirmRegistration() {
        this.status = "CONFIRMED";
        System.out.println("Registration confirmed for student " + studentID + " in course " + courseID);
    }

    public void cancelRegistration() {
        this.status = "CANCELLED";
        System.out.println("Registration cancelled for student " + studentID + " in course " + courseID);
    }
}
