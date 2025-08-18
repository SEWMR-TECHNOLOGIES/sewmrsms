import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Star, Zap, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function BillingPurchase() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("https://api.sewmrsms.co.tz/api/v1/plans");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        } else {
          console.error("Unexpected response:", data);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Credits</h1>
        <p className="text-muted-foreground">
          Choose the perfect plan for your messaging needs. All plans include delivery reports and support.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {/* Loader overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div
              className="animate-spin rounded-full h-16 w-16 border-t-4 border-solid border-gray-200"
              style={{ borderTopColor: "hsl(6, 99%, 64%)" }}
            ></div>
          </div>
        )}

        {/* Plans */}
        {!loading &&
          plans.map((plan) => (
            <Card 
              key={plan.uuid} 
              className={cn("relative transition-all duration-200 hover:shadow-lg hover:scale-105")}
            >
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.best_for}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{plan.price_per_sms} TZS</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.start_sms_count.toLocaleString()}+ SMS
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {plan.price_per_sms} TZS per SMS
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.benefits?.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Purchase Button */}
                <Button asChild className="w-full">
                  <Link to={`/console/billing/${plan.uuid}`}>
                    Purchase Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Additional Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Shield className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">All transactions are encrypted and secure</p>
            </div>
            <div className="space-y-2">
              <Zap className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Instant Activation</h3>
              <p className="text-sm text-muted-foreground">Credits are added to your account immediately</p>
            </div>
            <div className="space-y-2">
              <Headphones className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Get help whenever you need it</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
