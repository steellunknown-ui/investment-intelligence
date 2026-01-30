/**
 * INTEGRATION GUIDE: QuickPickPanel for Insurance, Banking, Holdings
 * 
 * This file contains the code snippets you need to add to each page.
 * Apply these changes to your existing form dialogs.
 */

// ============================================
// 1. IMPORTS TO ADD (at top of each file)
// ============================================

import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { insuranceProviders, bankNames, popularStocks } from "@/src/lib/presets";
import { Sparkles } from "lucide-react"; // for mobile trigger button

// ============================================
// 2. STATE TO ADD (in component)
// ============================================

const [showQuickPick, setShowQuickPick] = useState(false); // for mobile sheet

// ============================================
// 3. INSURANCE PAGE - Dialog Form Body
// ============================================

// Replace the current Dialog form with this structure:
<DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>{editingId ? "Edit Policy" : "Add Insurance Policy"}</DialogTitle>
    <DialogDescription>
      Enter insurance policy details
    </DialogDescription>
  </DialogHeader>
  
  <form onSubmit={handleSubmit}>
    {/* Two-column layout for desktop */}
    <div className="grid md:grid-cols-2 gap-6">
      
      {/* LEFT COLUMN - Form Fields */}
      <div className="space-y-4">
        <Input
          label="Policy Number"
          value={formData.policy_number}
          onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
          required
        />
        
        <Select
          label="Policy Type"
          options={POLICY_TYPES}
          value={formData.policy_type}
          onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
        />
        
        {/* Provider Name with Mobile Quick Select Button */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-medium">Provider Name</label>
            {/* Mobile Quick Select Button */}
            <Sheet open={showQuickPick} onOpenChange={setShowQuickPick}>
              <SheetTrigger asChild>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  className="md:hidden h-6 text-xs gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Quick Select
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <QuickPickPanel
                  title="Select Insurance Provider"
                  subtitle="Popular Indian insurers"
                  items={insuranceProviders.map(name => ({ label: name, value: name }))}
                  onSelect={(value) => {
                    setFormData({ ...formData, provider_name: value });
                    setShowQuickPick(false);
                  }}
                />
              </SheetContent>
            </Sheet>
          </div>
          <Input
            value={formData.provider_name}
            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
            required
          />
        </div>
        
        <Input
          label="Policy Name (Optional)"
          value={formData.policy_name}
          onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
        />
        
        {/* Continue with other form fields... */}
      </div>
      
      {/* RIGHT COLUMN - QuickPickPanel for Desktop */}
      <div className="hidden md:block">
        <QuickPickPanel
          title="Select Provider"
          subtitle="Popular Indian insurers"
          items={insuranceProviders.map(name => ({ label: name, value: name }))}
          onSelect={(value) => setFormData({ ...formData, provider_name: value })}
        />
      </div>
    </div>
    
    {/* Form buttons */}
    <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
      <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : editingId ? "Update" : "Save"}
      </Button>
    </div>
  </form>
</DialogContent>

// ============================================
// 4. BANKING PAGE - Similar Pattern
// ============================================

// Use bankNames instead of insuranceProviders:
<QuickPickPanel
  title="Select Bank"
  subtitle="Popular Indian banks"
  items={bankNames.map(name => ({ label: name, value: name }))}
  onSelect={(value) => setFormData({ ...formData, bank_name: value })}
/>

// Mobile Sheet for bank_name field

// ============================================
// 5. HOLDINGS PAGE - Stock Symbol
// ============================================

// For holdings, you want both symbol AND name:
<QuickPickPanel
  title="Select Stock"
  subtitle="Popular NSE stocks"
  items={popularStocks.map(stock => ({ 
    label: stock.symbol, 
    value: stock.symbol,
    meta: stock.name 
  }))}
  onSelect={(value) => {
    const stock = popularStocks.find(s => s.symbol === value);
    setFormData({ 
      ...formData, 
      symbol: value,
      name: stock?.name || ""
    });
  }}
/>

// Mobile Sheet for holdings

// ============================================
// 6. KEY POINTS
// ============================================

/*
1. Desktop (md and up):
   - Two column grid: md:grid-cols-2
   - Left: form fields
   - Right: QuickPickPanel (hidden md:block)

2. Mobile:
   - Sheet trigger button next to input label
   - className="md:hidden" on trigger
   - Sheet opens from bottom with QuickPickPanel inside
   - setShowQuickPick(false) after selection

3. Dialog size:
   - Change sm:max-w-2xl to sm:max-w-5xl for wider desktop layout

4. onSelect callback:
   - Updates form state
   - Closes mobile sheet if needed
   - Does NOT submit form
*/
