package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.PaymentTransaction;

import java.util.List;

/** An online order with its payment history. */
public record TrackResponse(FoodOrder order, List<PaymentTransaction> payments) { }
