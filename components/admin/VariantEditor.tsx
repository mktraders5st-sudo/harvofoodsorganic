"use client";

import { addVariantAction, deleteVariantAction, updateVariantAction } from "@/lib/actions/admin";
import { formatGrams, LOW_STOCK, type Product, type Variant } from "@/lib/data";
import { cn } from "@/lib/format";
import { ActionForm, adminInput, SubmitButton } from "./forms";

function VariantRow({ productId, variant }: { productId: string; variant: Variant }) {
  const stockTone =
    variant.stock === 0 ? "text-tomato-600" : variant.stock <= LOW_STOCK ? "text-amber-700" : "text-forest-700";

  return (
    <li className={cn("rounded-xl border bg-white p-4", variant.active ? "border-cream-200" : "border-dashed border-cream-300")}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-20 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Size</p>
          <p className="text-lg font-bold">{formatGrams(variant.grams)}</p>
          <p className={cn("text-xs font-semibold", stockTone)}>
            {variant.stock === 0 ? "Out of stock" : `${variant.stock} in stock`}
          </p>
        </div>

        <ActionForm action={updateVariantAction} className="min-w-0 flex-1">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="w-28">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Price (Rs.)</span>
              <input name="price" type="number" min={0} step={1} required defaultValue={variant.price} className={adminInput} />
            </label>
            <label className="w-28">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Stock</span>
              <input name="stock" type="number" min={0} step={1} required defaultValue={variant.stock} className={adminInput} />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm font-medium">
              <input type="checkbox" name="active" defaultChecked={variant.active} className="h-4 w-4 accent-forest-700" />
              On sale
            </label>
            <SubmitButton>Save</SubmitButton>
          </div>
        </ActionForm>

        <ActionForm action={deleteVariantAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <SubmitButton
            variant="ghost"
            confirm={`Remove the ${formatGrams(variant.grams)} size? To stop selling it for now, untick "On sale" instead.`}
          >
            Remove
          </SubmitButton>
        </ActionForm>
      </div>
    </li>
  );
}

export function VariantEditor({ product }: { product: Product }) {
  return (
    <div className="space-y-4">
      {product.variants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-tomato-500 bg-tomato-50 p-4 text-sm text-tomato-700">
          This product has no package sizes, so it isn't shown in the shop. Add one below.
        </p>
      ) : (
        <ul className="space-y-3">
          {product.variants.map((v) => (
            <VariantRow key={v.id} productId={product.id} variant={v} />
          ))}
        </ul>
      )}

      <ActionForm
        action={addVariantAction}
        className="rounded-xl border border-cream-200 bg-cream-50 p-4"
        render={(state) => (
          <>
            <p className="mb-3 text-sm font-semibold">Add a package size</p>
            <input type="hidden" name="productId" value={product.id} />
            <div className="flex flex-wrap items-end gap-3">
              <label className="w-28">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Grams</span>
                <input name="grams" type="number" min={1} max={100000} required placeholder="500" defaultValue={state.values?.grams} aria-invalid={!!state.errors?.grams} className={adminInput} />
              </label>
              <label className="w-28">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Price (Rs.)</span>
                <input name="price" type="number" min={0} step={1} required defaultValue={state.values?.price} aria-invalid={!!state.errors?.price} className={adminInput} />
              </label>
              <label className="w-28">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Stock</span>
                <input name="stock" type="number" min={0} step={1} required defaultValue={state.values?.stock ?? 0} aria-invalid={!!state.errors?.stock} className={adminInput} />
              </label>
              <SubmitButton>Add size</SubmitButton>
            </div>
          </>
        )}
      />
    </div>
  );
}
