import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Star, Zap, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Your actual pricing packages from the pricing page
const pricingPackages = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses',
    credits: 1000,
    price: 9.99,
    features: [
      '1,000 SMS Credits',
      'Basic Analytics',
      'Standard Support',
      'Delivery Reports',
      'API Access'
    ],
    is_popular: false,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Most popular for growing businesses',
    credits: 5000,
    price: 39.99,
    features: [
      '5,000 SMS Credits',
      'Advanced Analytics',
      'Priority Support',
      'Custom Sender ID',
      'Bulk Messaging',
      'Template Management'
    ],
    is_popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large scale operations',
    credits: 15000,
    price: 99.99,
    features: [
      '15,000 SMS Credits',
      'Premium Analytics',
      '24/7 Support',
      'Multiple Sender IDs',
      'Advanced API',
      'Custom Integration',
      'Dedicated Account Manager'
    ],
    is_popular: false,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    description: 'Maximum capacity for enterprises',
    credits: 50000,
    price: 249.99,
    features: [
      '50,000 SMS Credits',
      'Real-time Analytics',
      '24/7 Premium Support',
      'Unlimited Sender IDs',
      'White-label Solution',
      'Custom Infrastructure',
      'SLA Guarantee'
    ],
    is_popular: false,
  },
];

export default function BillingPurchase() {
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (packageData: typeof pricingPackages[0]) => {
    setPurchasing(packageData.id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to purchase credits",
          variant: "destructive",
        });
        return;
      }

      // Create a transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          package_id: packageData.id,
          amount: packageData.price,
          credits: packageData.credits,
          transaction_type: 'purchase',
          status: 'completed',
          payment_method: 'demo',
          payment_reference: `demo_${Date.now()}`,
        });

      if (transactionError) throw transactionError;

      // Update user credits
      const { error: creditError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: user.id,
          credits: packageData.credits,
          total_purchased: packageData.credits,
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (creditError) throw creditError;

      toast({
        title: "Purchase successful!",
        description: `${packageData.credits.toLocaleString()} credits have been added to your account`,
      });

    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getIcon = (packageName: string) => {
    switch (packageName.toLowerCase()) {
      case 'starter': return Zap;
      case 'business': return Star;
      case 'enterprise': return Shield;
      case 'unlimited': return Headphones;
      default: return CreditCard;
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pricingPackages.map((pkg) => {
          const Icon = getIcon(pkg.name);
          return (
            <Card 
              key={pkg.id} 
              className={cn(
                "relative transition-all duration-200 hover:shadow-lg hover:scale-105",
                pkg.is_popular && "border-primary shadow-primary/20 shadow-lg"
              )}
            >
              {pkg.is_popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} SMS Credits
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${(pkg.price / pkg.credits * 1000).toFixed(2)} per 1,000 credits
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Purchase Button */}
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing === pkg.id}
                  className={cn(
                    "w-full",
                    pkg.is_popular && "bg-primary hover:bg-primary/90"
                  )}
                >
                  {purchasing === pkg.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
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