package com.thebalconyhouse.backend.addon;

import com.thebalconyhouse.backend.addon.dto.ChildcarePricingDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/addons")
public class AddonController {

    @GetMapping("/childcare")
    public ChildcarePricingDto childcare() {
        return new ChildcarePricingDto(ChildcarePricing.PRICE_PER_CHILD, ChildcarePricing.MAX_CHILDREN);
    }
}
