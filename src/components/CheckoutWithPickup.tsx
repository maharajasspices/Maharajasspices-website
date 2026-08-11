import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck } from "lucide-react";
interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
}
interface CheckoutWithPickupProps {
  onDeliveryMethodChange: (method: 'delivery' | 'pickup', locationId?: string) => void;
  selectedMethod: 'delivery' | 'pickup';
  selectedLocationId?: string;
}
export default function CheckoutWithPickup({
  onDeliveryMethodChange,
  selectedMethod,
  selectedLocationId
}: CheckoutWithPickupProps) {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchPickupLocations();
  }, []);
  const fetchPickupLocations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("pickup_locations").select("id, name, address, city, phone").eq("active", true);
      if (error) throw error;
      setPickupLocations(data || []);
    } catch (error) {
      console.error("Error fetching pickup locations:", error);
    } finally {
      setLoading(false);
    }
  };
  return <Card>
      <CardContent className="pt-6 space-y-4">
        <Label className="text-base font-semibold">Delivery Method</Label>
        
        <RadioGroup value={selectedMethod} onValueChange={value => {
        if (value === 'pickup' && pickupLocations.length > 0) {
          onDeliveryMethodChange('pickup', pickupLocations[0].id);
        } else {
          onDeliveryMethodChange(value as 'delivery' | 'pickup');
        }
      }}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Courier Delivery</div>
                <div className="text-sm text-muted-foreground">Delivered to your door</div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Store Pickup</div>
                <div className="text-sm text-muted-foreground">Collect from our store</div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {selectedMethod === 'pickup' && !loading && pickupLocations.length > 0 && <div className="mt-4 space-y-3">
            <Label>Select Pickup Location</Label>
            {pickupLocations.map(location => <div key={location.id} className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedLocationId === location.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`} onClick={() => onDeliveryMethodChange('pickup', location.id)}>
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-muted-foreground">Unit 17, 10 A, Rockwood Business Park, Woodlands Dr</div>
                <div className="text-sm text-muted-foreground">Waterfall, Durban, 3610</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tel: 068 405 1374         
                </div>
              </div>)}
          </div>}

        {selectedMethod === 'pickup' && !loading && pickupLocations.length === 0 && <p className="text-sm text-muted-foreground">No pickup locations available at the moment.</p>}
      </CardContent>
    </Card>;
}