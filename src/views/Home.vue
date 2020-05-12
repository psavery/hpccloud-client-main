<style>
.center {
  text-align: center;
  margin: auto;
}
</style>

<template>
  <div class="center">
    <br />
    <br />
    <v-icon size="250">mdi-cloud-download</v-icon>
    <h2>Welcome to HPCCloud</h2>
    <p>
      Get started by <router-link to="/Register">registering</router-link> or
      <router-link to="/Login">logging in</router-link>.
    </p>
  </div>
</template>

<script>
import { authRedirect } from '@/utils/RedirectHelper';

export default authRedirect(
  {
    name: 'home',
    inject: ['girderRest'],
  },
  '/defaultProject'
);
</script>
