<script lang="ts">
  import { Building2, CheckCircle, Shield, ArrowRight, UploadCloud } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  let selectedPlan = 'professional';
  let submitted = false;

  const NIGERIAN_STATES = ['Abia', 'Abuja', 'Lagos', 'Kano', 'Rivers', 'Oyo'];

  const submitForm = () => {
    submitted = true;
  };
</script>

<div class="min-h-screen bg-[#050A0E] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
  <!-- Background effects -->
  <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

  {#if submitted}
    <div class="max-w-2xl mx-auto mt-20 text-center" in:fade>
      <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/20 mb-8">
        <CheckCircle class="h-12 w-12 text-blue-400" />
      </div>
      <h2 class="text-4xl font-bold mb-4">Registration Successful!</h2>
      <p class="text-gray-400 text-lg mb-8">Your estate manager reference is <span class="text-blue-400 font-bold">ADK-MGR-2024-1102</span></p>
      
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto text-left">
        <h3 class="font-semibold text-lg mb-4 text-blue-400">Next Steps:</h3>
        <ul class="space-y-4 text-gray-300">
          <li class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">1</div>
            Account verification (24hrs)
          </li>
          <li class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">2</div>
            Setup your property portfolio
          </li>
          <li class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">3</div>
            Invite your agents
          </li>
        </ul>
      </div>
      
      <a href="/" class="inline-block mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">Return to Home</a>
    </div>
  {:else}
    <div class="max-w-5xl mx-auto space-y-12">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 mb-4 text-blue-400">
          <Building2 class="w-10 h-10" />
        </div>
        <h1 class="text-3xl sm:text-5xl font-bold mb-4 text-white">Register Your Estate Management Company</h1>
        <p class="text-lg text-gray-400 max-w-2xl mx-auto">Join Nigeria's leading network of verified property managers. Streamline your operations, manage agents, and reach more clients.</p>
      </div>

      <!-- Plan Selection -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Starter Plan -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all cursor-pointer relative {selectedPlan === 'starter' ? 'ring-2 ring-blue-500 bg-blue-900/10' : ''}" on:click={() => selectedPlan = 'starter'}>
          <h3 class="text-xl font-bold text-white mb-2">Starter</h3>
          <p class="text-gray-400 text-sm mb-4">For small portfolios</p>
          <div class="text-3xl font-bold text-white mb-6">Free</div>
          <ul class="space-y-3 mb-6">
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Up to 10 properties</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> 2 Agent accounts</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Basic analytics</li>
          </ul>
        </div>

        <!-- Pro Plan -->
        <div class="bg-white/5 border border-blue-500/50 rounded-2xl p-6 hover:border-blue-400 transition-all cursor-pointer relative {selectedPlan === 'professional' ? 'ring-2 ring-blue-400 bg-blue-900/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : ''}" on:click={() => selectedPlan = 'professional'}>
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
          <h3 class="text-xl font-bold text-blue-400 mb-2">Professional</h3>
          <p class="text-gray-400 text-sm mb-4">For growing agencies</p>
          <div class="text-3xl font-bold text-white mb-6">₦25,000<span class="text-sm font-normal text-gray-400">/mo</span></div>
          <ul class="space-y-3 mb-6">
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Up to 100 properties</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> 10 Agent accounts</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Full analytics & reporting</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Priority support</li>
          </ul>
        </div>

        <!-- Enterprise Plan -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all cursor-pointer relative {selectedPlan === 'enterprise' ? 'ring-2 ring-blue-500 bg-blue-900/10' : ''}" on:click={() => selectedPlan = 'enterprise'}>
          <h3 class="text-xl font-bold text-white mb-2">Enterprise</h3>
          <p class="text-gray-400 text-sm mb-4">For large operations</p>
          <div class="text-3xl font-bold text-white mb-6">₦75,000<span class="text-sm font-normal text-gray-400">/mo</span></div>
          <ul class="space-y-3 mb-6">
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Unlimited properties</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Unlimited Agent accounts</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Advanced analytics</li>
            <li class="flex items-start gap-2 text-sm text-gray-300"><CheckCircle class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> Dedicated account manager</li>
          </ul>
        </div>
      </div>

      <form on:submit|preventDefault={submitForm} class="space-y-8">
        <!-- Company Details -->
        <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 class="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6">Company Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Company Name</label>
              <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Business Type</label>
              <select class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>Property Management Company</option>
                <option>Real Estate Developer</option>
                <option>Individual Manager</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">CAC Registration Number</label>
              <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">TIN (Optional)</label>
              <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-gray-400 mb-1">Full Company Address</label>
              <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">State</label>
              <select class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                {#each NIGERIAN_STATES as state}<option>{state}</option>{/each}
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Company Website (Optional)</label>
              <input type="url" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://" />
            </div>
          </div>
        </div>

        <!-- Contact Person Section -->
        <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 class="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6">Primary Contact Person</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Full Name</label>
              <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Job Title</label>
              <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="CEO, Director, etc." required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Direct Phone</label>
              <input type="tel" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Business Email</label>
              <input type="email" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
            </div>
          </div>
        </div>

        <!-- Portfolio Overview -->
        <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 class="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6">Portfolio Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Properties Currently Managed</label>
              <select class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>0-10</option><option>10-50</option><option>50-100</option><option>100-500</option><option>500+</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Total AUM Range</label>
              <select class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>Under ₦100M</option><option>₦100M - ₦1B</option><option>₦1B - ₦10B</option><option>Above ₦10B</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-gray-400 mb-3">Property Types Managed</label>
              <div class="flex flex-wrap gap-4">
                {#each ['Residential', 'Commercial', 'Mixed Use', 'Land'] as type}
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" class="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-black/40" />
                    <span class="text-sm text-gray-300">{type}</span>
                  </label>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Documents Section -->
        <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 class="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6">Required Documents</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {#each [
              { name: 'CAC Certificate', req: true },
              { name: 'Director\'s ID', req: true },
              { name: 'Proof of Address', req: true }
            ] as doc}
              <div class="border border-dashed border-white/20 rounded-xl p-6 bg-black/20 flex flex-col items-center justify-center text-center hover:border-blue-500/50 transition-colors cursor-pointer group">
                <UploadCloud class="h-8 w-8 text-gray-500 mb-2 group-hover:text-blue-400 transition-colors" />
                <h3 class="font-medium text-sm text-white mb-1">{doc.name}</h3>
                <span class="text-[10px] uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Required</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Submit Section -->
        <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <label class="flex items-start gap-3 cursor-pointer flex-1">
            <input type="checkbox" class="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-black" required />
            <span class="text-sm text-gray-300">
              I agree to the ADK <a href="#" class="text-blue-400 hover:underline">Terms of Service</a> for Estate Managers and confirm all provided information is accurate.
            </span>
          </label>
          <button type="submit" class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-medium transition-transform hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)] whitespace-nowrap">
            Submit Registration <ArrowRight class="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
