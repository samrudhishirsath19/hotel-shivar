package com.hotelshivar.backend.dto;

/**
 * Rules for a person's full name typed on the website (enquiry, sign-up, booking, online order):
 * letters in any script (e.g. "Ravi Kumar Sharma", "राहुल पाटील"), spaces between words, and . ' - as in
 * "D'Souza" or "Anne-Marie". Extra spaces are removed before the name is checked and saved.
 */
public final class Names {

    public static final String PATTERN = "^[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]{0,99}$";
    public static final String MESSAGE = "Enter a valid full name (letters and spaces, up to 100 characters)";

    private Names() { }

    /** Trims and turns runs of spaces / tabs into one space; null stays null. */
    public static String clean(String raw) {
        return raw == null ? null : raw.trim().replaceAll("\\s+", " ");
    }
}
