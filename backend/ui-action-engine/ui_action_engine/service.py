from shared.models.schemas import PriceAnalysis, ProductDetection, UiAction


class UiEngine:
    @staticmethod
    def _scale_coords(
        coords: tuple[int, int, int, int],
        source_size: tuple[int, int] | None,
        viewport_size: tuple[int, int] | None,
    ) -> tuple[int, int, int, int]:
        if not source_size or not viewport_size:
            return coords

        src_w, src_h = source_size
        view_w, view_h = viewport_size
        if src_w <= 0 or src_h <= 0 or view_w <= 0 or view_h <= 0:
            return coords

        x, y, w, h = coords
        scale_x = view_w / src_w
        scale_y = view_h / src_h
        return (
            int(x * scale_x),
            int(y * scale_y),
            max(1, int(w * scale_x)),
            max(1, int(h * scale_y)),
        )

    def suggest_actions(
        self,
        products: list[ProductDetection],
        analysis: PriceAnalysis,
        source_size: tuple[int, int] | None = None,
        viewport_size: tuple[int, int] | None = None,
    ) -> list[UiAction]:
        actions: list[UiAction] = []

        if products:
            cheapest = min(products, key=lambda p: p.price)
            actions.append(
                UiAction(
                    highlight_coords=self._scale_coords(cheapest.coords, source_size, viewport_size),
                    action_type="click",
                    target=f"Best visible price: {cheapest.name}",
                    message="Inspect this listing first before committing.",
                )
            )

        if analysis.savings > 0:
            actions.append(
                UiAction(
                    highlight_coords=self._scale_coords((80, 80, 260, 50), source_size, viewport_size),
                    action_type="scroll",
                    target="Find coupon or discount area",
                    message="There is a strong chance to reduce the current price.",
                    code="MAMA10",
                )
            )

        if not actions:
            actions.append(
                UiAction(
                    highlight_coords=self._scale_coords((40, 40, 220, 50), source_size, viewport_size),
                    action_type="none",
                    target="Need clearer screenshot",
                    message="Capture the product area and coupon section together.",
                )
            )

        return actions
