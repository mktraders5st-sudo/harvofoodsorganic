import { cn } from "@/lib/format";
import {
  CardIcon,
  HeartPulseIcon,
  LeafIcon,
  NoPreservativeIcon,
  ReturnIcon,
  ShieldIcon,
  SparkleIcon,
  TruckIcon,
} from "./icons";

export const trustPoints = [
  { icon: TruckIcon, label: "Delivery across Pakistan" },
  { icon: ShieldIcon, label: "100% certified organic" },
  { icon: ReturnIcon, label: "Easy returns" },
  { icon: CardIcon, label: "Cash on delivery" },
];

/** The four promises printed on the Harvo flyer. */
export const benefits = [
  { icon: LeafIcon, title: "100% Natural", text: "Made only from real vegetables, fruits and spices. Nothing artificial." },
  { icon: NoPreservativeIcon, title: "No Preservatives", text: "No chemicals, colours or additives. Just pure dehydrated goodness." },
  { icon: SparkleIcon, title: "Pure & Fresh", text: "Small-batch dried and freshly packed to lock in aroma and flavour." },
  { icon: HeartPulseIcon, title: "Rich in Nutrition", text: "Gentle drying keeps the vitamins, minerals and fibre intact." },
];

export function TrustStrip() {
  return (
    <div className="border-y border-cream-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-4 lg:px-8">
        {trustPoints.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2.5 text-xs font-semibold text-forest-900 sm:text-sm">
            <Icon className="h-5 w-5 shrink-0 text-tomato-600" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** `dark` renders white-on-green for use on a forest background. */
export function ValueGrid({ dark = false }: { dark?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {benefits.map(({ icon: Icon, title, text }) => (
        <div
          key={title}
          className={cn(
            "rounded-2xl p-6 text-center",
            dark ? "bg-white/5 ring-1 ring-white/10" : "border border-cream-200 bg-white",
          )}
        >
          <div
            className={cn(
              "mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full",
              dark ? "bg-white text-forest-700" : "bg-forest-100 text-forest-700",
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
          <h3 className={cn("text-xl font-bold", dark && "text-white")}>{title}</h3>
          <p className={cn("mt-2 text-sm", dark ? "text-forest-100/80" : "text-muted")}>{text}</p>
        </div>
      ))}
    </div>
  );
}
