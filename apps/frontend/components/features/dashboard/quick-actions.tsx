import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { Plus, Package, ShoppingCart, Boxes } from "lucide-react";

const QuickActions = () => {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => router.push("/pos")}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        New Sale{" "}
        <span className="ml-1.5 rounded border border-gray-300  px-1.5 py-0.5 text-xs ">
          F2
        </span>
      </Button>
      <Button variant="outline" onClick={() => router.push("/stock/new")}>
        <Plus className="h-4 w-4 mr-2" />
        New Purchase
        <span className="ml-1.5 rounded border border-gray-300  px-1.5 py-0.5 text-xs ">
          F3
        </span>
      </Button>
      <Button variant="outline" onClick={() => router.push("/products/new")}>
        <Package className="h-4 w-4 mr-2" />
        Add Product
        <span className="ml-1.5 rounded border border-gray-300  px-1.5 py-0.5 text-xs ">
          F4
        </span>
      </Button>
      <Button variant="outline" onClick={() => router.push("/inventory")}>
        <Boxes className="h-4 w-4 mr-2" />
        Check Inventory
        <span className="ml-1.5 rounded border border-gray-300  px-1.5 py-0.5 text-xs ">
          F5
        </span>
      </Button>
    </div>
  );
};

export default QuickActions;
