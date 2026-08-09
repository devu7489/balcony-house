package com.thebalconyhouse.backend.addon;

import com.thebalconyhouse.backend.addon.dto.ChildcarePricingDto;
import com.thebalconyhouse.backend.addon.dto.FullBoardPricingDto;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/addons")
@Validated
public class AddonController {

    private final ChildcarePricing childcarePricing;
    private final FullBoardPricing fullBoardPricing;

    public AddonController(ChildcarePricing childcarePricing, FullBoardPricing fullBoardPricing) {
        this.childcarePricing = childcarePricing;
        this.fullBoardPricing = fullBoardPricing;
    }

    @GetMapping("/childcare")
    public ChildcarePricingDto childcare(@RequestParam(required = false) @Min(1) Long nights) {
        if (nights == null) {
            return new ChildcarePricingDto(null, null, ChildcarePricing.MAX_CHILDREN_PER_ROOM);
        }
        return new ChildcarePricingDto(childcarePricing.perDayRate(nights), childcarePricing.totalPerChild(nights),
                ChildcarePricing.MAX_CHILDREN_PER_ROOM);
    }

    @GetMapping("/fullboard")
    public FullBoardPricingDto fullBoard() {
        return new FullBoardPricingDto(fullBoardPricing.getPricePerPersonPerDay());
    }
}
