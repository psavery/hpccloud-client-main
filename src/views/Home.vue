<template>
  <div class="home">
    Better landing page... You need to be logged in to do something...
  </div>
</template>

<script>
import { authRedirect } from '@/src/utils/RedirectHelper';

export default authRedirect(
  {
    name: 'home',
    inject: ['girderRest'],
  },
  '/projects'
);
</script>
