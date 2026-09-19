<script lang="ts">
  import { Building2, Hash, User, Mail, Phone, Lock } from 'lucide-svelte';
</script>

<form class="space-y-5" on:submit|preventDefault={() => alert('Manager Signup')}>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
      <div class="relative">
        <Building2 class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="text" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Apex Estate Management" required />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">CAC Reg Number</label>
      <div class="relative">
        <Hash class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="text" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500" placeholder="RC-123456" required />
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
      <div class="relative">
        <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="text" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Michael Okafor" required />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
      <div class="relative">
        <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="email" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500" placeholder="admin@apex.com" required />
      </div>
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
    <div class="relative flex">
      <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-black/40 text-gray-400 text-sm">+234</span>
      <input type="tel" class="flex-1 min-w-0 block w-full px-3 py-2 bg-black/20 border border-white/10 rounded-none rounded-r-lg text-white focus:ring-blue-500 focus:border-blue-500" placeholder="801 234 5678" required />
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
    <div class="relative">
      <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      <input type="password" class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" required />
    </div>
  </div>

  <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-[1.02] active:scale-95">
    Quick Register
  </button>
  
  <div class="text-center mt-4">
    <a href="/register/manager" class="text-blue-400 hover:text-blue-300 font-medium text-sm flex justify-center items-center gap-1 mt-1">
      Complete full registration for estate managers &rarr;
    </a>
  </div>
</form>
