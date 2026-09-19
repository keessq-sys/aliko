<script lang="ts">
  import { User, Mail, Phone, Lock, Briefcase, FileBadge } from 'lucide-svelte';
</script>

<form class="space-y-5" on:submit|preventDefault={() => alert('Agent Signup')}>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
      <div class="relative">
        <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="text" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="Jane Smith" required />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
      <div class="relative">
        <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="email" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="jane@agency.com" required />
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
      <div class="relative flex">
        <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-black/40 text-gray-400 text-sm">+234</span>
        <input type="tel" class="flex-1 min-w-0 block w-full px-3 py-2 bg-black/20 border border-white/10 rounded-none rounded-r-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="801 234 5678" required />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Agency Name</label>
      <div class="relative">
        <Briefcase class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="text" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="Smith Realty Ltd" required />
      </div>
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-300 mb-1">License Number (Optional)</label>
    <div class="relative">
      <FileBadge class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      <input type="text" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="REAN/NIA Number" />
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
      <div class="relative">
        <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="password" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" required />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
      <div class="relative">
        <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="password" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" required />
      </div>
    </div>
  </div>

  <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(217,119,6,0.3)] text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transform transition hover:scale-[1.02] active:scale-95">
    Quick Register
  </button>
  
  <div class="text-center mt-4">
    <p class="text-sm text-gray-400">Want access to premium tools?</p>
    <a href="/register/agent" class="text-amber-400 hover:text-amber-300 font-medium text-sm flex justify-center items-center gap-1 mt-1">
      Complete full professional registration &rarr;
    </a>
  </div>
</form>
