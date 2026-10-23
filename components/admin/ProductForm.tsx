"use client";

import { createProductAction, updateProductAction, type ActionState } from "@/lib/actions/admin";
import { categories, type Product } from "@/lib/data";
import { ActionForm, adminInput, Field, SubmitButton } from "./forms";

/** Product details. Without `product` it creates a new product with its first package size. */
export function ProductForm({ product }: { product?: Product }) {
  const isNew = !product;

  const fields = (state: ActionState) => {
    const err = state.errors ?? {};
    // After an error, refill fields with what was submitted; otherwise show the saved product.
    const val = (name: string, fallback?: string | number) => (state.values ? (state.values[name] ?? "") : (fallback ?? ""));
    const on = (name: string, fallback: boolean) => (state.values ? state.values[name] === "on" : fallback);
    return (
      <div key={state.values ? JSON.stringify(state.values) : "saved"} className="grid gap-4 sm:grid-cols-2">
        {product && <input type="hidden" name="productId" value={product.id} />}

        <Field label="Product name" name="name" error={err.name} className="sm:col-span-2">
          <input id="name" name="name" required maxLength={80} defaultValue={val("name", product?.name)} aria-invalid={!!err.name} className={adminInput} />
        </Field>

        {isNew && (
          <Field
            label="Product ID (web address)"
            name="id"
            error={err.id}
            hint="Optional. Made from the name if left empty, e.g. onion-powder. Can't be changed later."
            className="sm:col-span-2"
          >
            <input id="id" name="id" maxLength={60} defaultValue={val("id")} placeholder="onion-powder" aria-invalid={!!err.id} className={adminInput} />
          </Field>
        )}

        <Field label="Category" name="category" error={err.category}>
          <select id="category" name="category" defaultValue={val("category", product?.category ?? categories[0].id)} className={adminInput}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Badge" name="badge" error={err.badge}>
          <select id="badge" name="badge" defaultValue={val("badge", product?.badge ?? "")} className={adminInput}>
            <option value="">None</option>
            <option value="Best Seller">Best Seller</option>
            <option value="New">New</option>
          </select>
        </Field>

        <Field label="Description" name="description" error={err.description} className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            defaultValue={val("description", product?.description)}
            className={adminInput}
          />
        </Field>

        <Field label="Pack colour" name="color" error={err.color} hint="Colour of the product in its pack image">
          <input id="color" name="color" type="color" defaultValue={val("color", product?.color ?? "#3f9d4c")} className="h-10 w-full cursor-pointer rounded-lg border border-cream-200 bg-white p-1" />
        </Field>

        <Field label="Slice rim colour" name="rim" error={err.rim} hint="Dried slices only, e.g. #c42d2d. Leave empty otherwise.">
          <input id="rim" name="rim" maxLength={7} placeholder="#c42d2d" defaultValue={val("rim", product?.rim)} aria-invalid={!!err.rim} className={adminInput} />
        </Field>

        <Field
          label="Photo path"
          name="image"
          error={err.image}
          hint="Optional. Put the photo in public/images/products/ and enter e.g. /images/products/onion.jpg"
          className="sm:col-span-2"
        >
          <input id="image" name="image" maxLength={200} placeholder="/images/products/onion.jpg" defaultValue={val("image", product?.image)} aria-invalid={!!err.image} className={adminInput} />
        </Field>

        {isNew && (
          <fieldset className="grid gap-4 rounded-xl border border-cream-200 p-4 sm:col-span-2 sm:grid-cols-3">
            <legend className="px-1 text-sm font-semibold">First package size</legend>
            <Field label="Size (grams)" name="grams" error={err.grams}>
              <input id="grams" name="grams" type="number" min={1} max={100000} defaultValue={val("grams", 50)} required aria-invalid={!!err.grams} className={adminInput} />
            </Field>
            <Field label="Price (Rs.)" name="price" error={err.price}>
              <input id="price" name="price" type="number" min={0} step={1} defaultValue={val("price")} required aria-invalid={!!err.price} className={adminInput} />
            </Field>
            <Field label="Stock (packs)" name="stock" error={err.stock}>
              <input id="stock" name="stock" type="number" min={0} step={1} defaultValue={val("stock", 0)} required aria-invalid={!!err.stock} className={adminInput} />
            </Field>
          </fieldset>
        )}

        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="active" defaultChecked={on("active", product?.active ?? true)} className="h-4 w-4 accent-forest-700" />
            Show in shop
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="featured" defaultChecked={on("featured", product?.featured ?? false)} className="h-4 w-4 accent-forest-700" />
            Feature on home page
          </label>
        </div>

        <div className="sm:col-span-2">
          <SubmitButton>{isNew ? "Create product" : "Save details"}</SubmitButton>
        </div>
      </div>
    );
  };

  return <ActionForm action={isNew ? createProductAction : updateProductAction} render={fields} />;
}
