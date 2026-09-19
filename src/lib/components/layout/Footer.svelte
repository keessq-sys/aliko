<script lang="ts">
  import { Twitter, Linkedin, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-svelte';
</script>

<footer class="relative mt-24 border-t border-emerald-900/50 bg-stone-900 overflow-hidden">
  <!-- Subtle top glow -->
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(5,150,105,1)]"></div>
  
  <div class="container mx-auto px-4 lg:px-8 pt-16 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
      
      <!-- Brand Col -->
      <div class="flex flex-col gap-6">
        <a href="/" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.4)]">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span class="text-xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400">
            Aliko Diamond Key
          </span>
        </a>
        <p class="text-sm text-stone-400 leading-relaxed">
          The premier platform for luxury real estate across Africa. Connecting discerning buyers with exceptional properties and elite agents.
        </p>
        <div class="flex items-center gap-4">
          <a href="#" class="p-2 rounded-full bg-white/5 text-stone-400 hover:text-emerald-400 hover:bg-emerald-900/20 transition-all"><Twitter size={18} /></a>
          <a href="#" class="p-2 rounded-full bg-white/5 text-stone-400 hover:text-emerald-400 hover:bg-emerald-900/20 transition-all"><Linkedin size={18} /></a>
          <a href="#" class="p-2 rounded-full bg-white/5 text-stone-400 hover:text-emerald-400 hover:bg-emerald-900/20 transition-all"><Instagram size={18} /></a>
          <a href="#" class="p-2 rounded-full bg-white/5 text-stone-400 hover:text-rose-400 hover:bg-rose-900/20 transition-all"><Youtube size={18} /></a>
        </div>
      </div>

      <!-- Properties Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">Properties</h4>
        <a href="/properties" class="text-sm text-stone-400 hover:text-white transition-colors">All Listings</a>
        <a href="/properties?type=residential" class="text-sm text-stone-400 hover:text-white transition-colors">Residential</a>
        <a href="/properties?type=commercial" class="text-sm text-stone-400 hover:text-white transition-colors">Commercial</a>
        <a href="/properties?featured=true" class="text-sm text-stone-400 hover:text-emerald-400 transition-colors">Featured Estates</a>
        <a href="/map" class="text-sm text-stone-400 hover:text-white transition-colors">Map Search</a>
      </div>

      <!-- Company Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">Company</h4>
        <a href="/about" class="text-sm text-stone-400 hover:text-white transition-colors">About Us</a>
        <a href="/agents" class="text-sm text-stone-400 hover:text-white transition-colors">Our Agents</a>
        <a href="/careers" class="text-sm text-stone-400 hover:text-white transition-colors">Careers</a>
        <div class="mt-2 flex flex-col gap-2">
          <button class="btn-primary text-xs py-1.5 w-full">Join as Agent</button>
          <button class="btn-secondary text-xs py-1.5 w-full">Become a Manager</button>
        </div>
      </div>

      <!-- Contact/Newsletter Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">Contact & Newsletter</h4>
        <div class="flex flex-col gap-2 text-sm text-stone-400">
          <span class="flex items-center gap-2"><MapPin size={16} class="text-emerald-500" /> Lagos, Nigeria</span>
          <span class="flex items-center gap-2"><Phone size={16} class="text-emerald-500" /> +234 800 DIAMOND</span>
          <span class="flex items-center gap-2"><Mail size={16} class="text-emerald-500" /> contact@adk.com</span>
        </div>
        
        <form class="mt-4 flex flex-col gap-2" on:submit|preventDefault>
          <p class="text-xs text-stone-400 mb-1">Subscribe for exclusive listings</p>
          <div class="flex gap-2">
            <input type="email" placeholder="Email address" class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" required />
            <button type="submit" class="btn-primary px-3 py-2"><Mail size={16} /></button>
          </div>
        </form>
      </div>

    </div>

    <!-- Bottom Bar -->
    <div class="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-xs text-stone-500">
        &copy; {new Date().getFullYear()} Aliko Diamond Key. All rights reserved.
      </p>
      <div class="flex items-center gap-4 text-xs text-stone-500">
        <a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
        <a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
        <a href="/document-tracking" class="hover:text-white transition-colors">Document Tracking</a>
      </div>
      <p class="text-xs font-mono text-stone-600 flex items-center gap-1">
        Powered by <span class="text-emerald-500/70">ADK Platform</span>
      </p>
    </div>
  </div>
</footer>
