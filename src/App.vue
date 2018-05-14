<template>
  <div id="app" class="tasker container-fluid">
    <div class="col-md-2 sidebar">
      <h1><a href="#">Rolling Tasker</a></h1>
      <h2>Projects</h2>
      <ol id="projects">
      </ol>
    </div>
    <router-view></router-view>
    <div class="col-md-10 col-md-offset-2 main">
      <div class="log-header">
        <h2 id="month"></h2>
        <div class="row" id="days">
          <div class="column">
          </div>
        </div>
      </div>
      <div class="row log-content" id="logs">
      </div>
    </div>
  </div>
</template>
