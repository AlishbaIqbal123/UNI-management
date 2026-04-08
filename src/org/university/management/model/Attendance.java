package org.university.management.model;

import java.util.Date;

public class Attendance {
    private String attendanceID;
    private String studentID;
    private String courseID;
    private Date date;
    private Boolean status;

    public Attendance() {
    }

    public Attendance(String attendanceID, String studentID, String courseID, Date date, Boolean status) {
        this.attendanceID = attendanceID;
        this.studentID = studentID;
        this.courseID = courseID;
        this.date = date;
        this.status = status;
    }

    public String getAttendanceID() {
        return attendanceID;
    }

    public void setAttendanceID(String attendanceID) {
        this.attendanceID = attendanceID;
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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public void markPresent() {
        this.status = true;
        System.out.println("Student " + studentID + " marked present for " + courseID + " on " + date);
    }

    public void markAbsent() {
        this.status = false;
        System.out.println("Student " + studentID + " marked absent for " + courseID + " on " + date);
    }
}
