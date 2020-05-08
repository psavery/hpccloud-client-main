function filterQuery(query = {}, ...keys) {
  const out = {};
  keys.forEach((key) => {
    if (query[key] !== undefined && query[key] !== null) {
      out[key] = query[key];
    }
  });
  return out;
}

const CHUNK_SIZE = 10 * 1024 * 1024;

export default {
  state: {
    apiRoot: '',
    girderClient: null,
    eventSource: null,
  },
  getters: {
    HTTP_CLIENT(state) {
      return state.girderClient;
    },
  },
  mutations: {
    HTTP_CLIENT_SET(state, value) {
      state.girderClient = value;
      state.apiRoot = value.apiRoot;
    },
  },
  actions: {
    // --- EVENTS -------------------------------------------------------------
    HTTP_CONNECT_EVENTS({ state, dispatch }) {
      dispatch('HTTP_DISCONNECT_EVENTS');
      if (EventSource && !state.eventSource) {
        state.eventSource = new EventSource(
          `${state.apiRoot}/notification/stream`
        );
        state.eventSource.onmessage = ({ data }) => {
          dispatch('HTTP_EVENT', JSON.parse(data));
        };
        state.eventSource.onerror = () => {
          // Wait 2 seconds if the browser hasn't reconnected then reinitialize.
          setTimeout(() => {
            dispatch('HTTP_CONNECT_EVENTS');
          }, 2000);
        };
      }
    },
    HTTP_DISCONNECT_EVENTS({ state }) {
      if (
        state.eventSource &&
        state.eventSource.readyState !== EventSource.CLOSED
      ) {
        state.eventSource.close();
      }
      state.eventSource = null;
    },
    HTTP_EVENT({ dispatch }, message) {
      const { type, data } = message;
      if (data && data.status) {
        const { _id: id, status } = data;
        dispatch('EVENTS_STATUS', { id, type, status });
      } else if (data && data.log) {
        const { _id: id, log } = data;
        dispatch('EVENTS_LOG', { id, type, log });
      } else if (type === 'progress') {
        // progress
        console.log(
          `progress ${message.current}/${message.total} - ${(
            (100 * message.current) /
            message.total
          ).toFixed(0)}%`
        );
      }
    },
    // --- LOGIN --------------------------------------------------------------
    HTTP_LOGOUT({ state, dispatch }) {
      dispatch('HTTP_DISCONNECT_EVENTS');
      state.girderClient.logout();
    },
    // --- FOLDERS ------------------------------------------------------------
    async HTTP_FOLDERS_CREATE({ state }, folder) {
      return state.girderClient.post('folder', null, { params: folder });
    },
    // --- ITEMS -----------------------------------------------------------
    async HTTP_ITEMS_CREATE({ state }, item) {
      return state.girderClient.post('item', null, { params: item });
    },
    // --- FILES -----------------------------------------------------------
    async HTTP_FILES_CHUNK({ state }, { uploadId, offset, blob }) {
      return state.girderClient.post('file/chunk', blob, {
        params: {
          uploadId,
          offset,
        },
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    },
    async HTTP_FILES_UPLOAD({ state, dispatch }, fileEntry) {
      const { parentType, parentId, name, size, file } = fileEntry;
      const fileId = `${file.name}_${file.lastModified}`;
      const { data: upload } = await state.girderClient.post(`file`, null, {
        params: {
          parentType,
          parentId,
          name,
          size,
        },
      });
      const uploadId = upload._id;

      async function uploadNextChunk(offset) {
        dispatch('HTTP_EVENT', {
          type: 'progress',
          current: offset,
          total: size,
          id: fileId,
        });
        if (offset + CHUNK_SIZE >= size) {
          const blob = file.slice(offset);
          const { data: finish } = await dispatch('HTTP_FILES_CHUNK', {
            uploadId,
            offset,
            blob,
          });
          dispatch('HTTP_EVENT', {
            type: 'progress',
            current: size,
            total: size,
            id: fileId,
          });
          return finish;
        }
        const blob = file.slice(offset, offset + CHUNK_SIZE);
        await dispatch('HTTP_FILES_CHUNK', { uploadId, offset, blob });
        return uploadNextChunk(offset + CHUNK_SIZE);
      }

      const data = await uploadNextChunk(0);
      return { data };
    },
    // --- PROJECTS -----------------------------------------------------------
    async HTTP_PROJECTS_LIST({ state }) {
      return state.girderClient.get('projects');
    },
    async HTTP_PROJECTS_CREATE({ state }, project) {
      return state.girderClient.post('projects', project);
    },
    async HTTP_PROJECTS_GET_BY_ID({ state }, id) {
      return state.girderClient.get(`projects/${id}`);
    },
    async HTTP_PROJECTS_UPDATE({ state }, project) {
      const cleaned = { ...project };
      [
        '_id',
        'access',
        'created',
        'folderId',
        'steps',
        'type',
        'updated',
        'userId',
      ].forEach((key) => delete cleaned[key]);
      return state.girderClient.patch(`projects/${project._id}`, cleaned);
    },
    async HTTP_PROJECTS_DELETE({ state }, id) {
      return state.girderClient.delete(`projects/${id}`);
    },
    async HTTP_PROJECTS_GET_ACCESS({ state }, id) {
      return state.girderClient.get(`projects/${id}/access`);
    },
    async HTTP_PROJECTS_SET_ACCESS(
      { state },
      { id, users, groups, level = 0, flags = [] }
    ) {
      return state.girderClient.put(`projects/${id}/access`, {
        users,
        groups,
        level: parseInt(level, 10),
        flags,
      });
    },
    async HTTP_PROJECTS_PATCH_ACCESS(
      { state },
      { id, users, groups, level = 0, flags = [] }
    ) {
      return state.girderClient.patch(`projects/${id}/access`, {
        users,
        groups,
        level: parseInt(level, 10),
        flags,
      });
    },
    async HTTP_PROJECTS_REVOKE_ACCESS({ state }, { id, users, groups }) {
      return state.girderClient.patch(`projects/${id}/access/revoke`, {
        users,
        groups,
      });
    },
    async HTTP_PROJECTS_GET_SIMULATION_LIST({ state }, id) {
      return state.girderClient.get(`projects/${id}/simulations`);
    },
    // --- SIMULATIONS --------------------------------------------------------
    async HTTP_SIMULATIONS_CREATE({ state }, simulation) {
      return state.girderClient.post(
        `/projects/${simulation.projectId}/simulations`,
        simulation
      );
    },
    async HTTP_SIMULATIONS_GET_BY_ID({ state }, id) {
      return state.girderClient.get(`simulations/${id}`);
    },
    async HTTP_SIMULATIONS_UPDATE({ state }, simulation) {
      const cleaned = { ...simulation };
      [
        '_id',
        'access',
        'created',
        'folderId',
        'projectId',
        'updated',
        'userId',
      ].forEach((key) => delete cleaned[key]);
      return state.girderClient.patch(
        `simulations/${simulation._id || simulation.id}`,
        cleaned
      );
    },
    async HTTP_SIMULATIONS_DELETE({ state }, id) {
      return state.girderClient.delete(`simulations/${id}`);
    },
    async HTTP_SIMULATIONS_CLONE(
      { state },
      { id, name = 'Cloned simulation' }
    ) {
      return state.girderClient.post(`simulations/${id}/clone`, { name });
    },
    async HTTP_SIMULATIONS_DOWNLOAD({ state }, id) {
      return state.girderClient.get(`simulations/${id}/download`);
    },
    async HTTP_SIMULATIONS_GET_STEP({ state }, { id, name }) {
      return state.girderClient.get(`simulations/${id}/steps/${name}`);
    },
    async HTTP_SIMULATIONS_UPDATE_STEP({ state }, { id, step, content }) {
      const payload = { ...content };
      // Remove read-only keys
      ['type', 'folderId'].forEach((key) => {
        delete payload[key];
      });

      return state.girderClient.patch(
        `simulations/${id}/steps/${step}`,
        payload
      );
    },
    async HTTP_SIMULATIONS_GET_ACCESS({ state }, id) {
      return state.girderClient.get(`simulations/${id}/access`);
    },
    async HTTP_SIMULATIONS_SET_ACCESS(
      { state },
      { id, users, groups, level = 0, flags = [] }
    ) {
      return state.girderClient.put(`simulations/${id}/access`, {
        users,
        groups,
        level: parseInt(level, 10),
        flags,
      });
    },
    async HTTP_SIMULATIONS_PATCH_ACCESS(
      { state },
      { id, users, groups, level = 0, flags = [] }
    ) {
      return state.girderClient.patch(`simulations/${id}/access`, {
        users,
        groups,
        level: parseInt(level, 10),
        flags,
      });
    },
    async HTTP_SIMULATIONS_REVOKE_ACCESS({ state }, { id, users, groups }) {
      return state.girderClient.patch(`simulations/${id}/access/revoke`, {
        users,
        groups,
      });
    },
    // --- TASKFLOWS ----------------------------------------------------------
    async HTTP_TASKFLOWS_CREATE({ state }, taskFlowClass) {
      return state.girderClient.post('taskflows', { taskFlowClass });
    },
    async HTTP_TASKFLOWS_GET({ state }, { id, path }) {
      if (path) {
        return state.girderClient.get(`taskflows/${id}?path=${path}`);
      }
      return state.girderClient.get(`taskflows/${id}`);
    },
    async HTTP_TASKFLOWS_UPDATE({ state }, { id, content }) {
      return state.girderClient.patch(`taskflows/${id}`, content);
    },
    async HTTP_TASKFLOWS_DELETE({ state }, { id }) {
      return state.girderClient.delete(`taskflows/${id}`);
    },
    async HTTP_TASKFLOWS_GET_LOG({ state }, { id, offset = 0 }) {
      if (offset) {
        return state.girderClient.get(`taskflows/${id}/log?offset=${offset}`);
      }
      return state.girderClient.get(`taskflows/${id}/log`);
    },
    async HTTP_TASKFLOWS_START({ state }, { id, cluster }) {
      return state.girderClient.put(`taskflows/${id}/start`, cluster);
    },
    async HTTP_TASKFLOWS_STATUS({ state }, { id }) {
      return state.girderClient.get(`taskflows/${id}/status`);
    },
    async HTTP_TASKFLOWS_GET_TASKS({ state }, { id }) {
      return state.girderClient.get(`taskflows/${id}/tasks`);
    },
    async HTTP_TASKFLOWS_CREATE_TASK({ state }, { id, content }) {
      return state.girderClient.post(`taskflows/${id}/tasks`, content);
    },
    async HTTP_TASKFLOWS_TERMINATE({ state }, { id }) {
      return state.girderClient.put(`taskflows/${id}/terminate`);
    },
    async HTTP_TASKFLOWS_SHARE({ state }, { id, user = [], groups = [] }) {
      return state.girderClient.patch(`taskflows/${id}/access`, {
        user,
        groups,
      });
    },
    async HTTP_TASKFLOWS_UNSHARE({ state }, { id, user = [], groups = [] }) {
      return state.girderClient.patch(`taskflows/${id}/access/revoke`, {
        user,
        groups,
      });
    },
    // --- TASKS --------------------------------------------------------------
    async HTTP_TASKS_GET({ state }, { id }) {
      return state.girderClient.get(`tasks/${id}`);
    },
    async HTTP_TASKS_GET_LOG({ state }, { id }) {
      return state.girderClient.get(`tasks/${id}/log`);
    },
    async HTTP_TASKS_GET_STATUS({ state }, { id }) {
      return state.girderClient.get(`tasks/${id}/status`);
    },
    async HTTP_TASKS_UPDATE({ state }, { id, content }) {
      return state.girderClient.patch(`tasks/${id}`, content);
    },
    // --- JOBS ---------------------------------------------------------------
    async HTTP_JOBS_GET({ state }, { offset = 0, limit = 0 }) {
      const query = [];
      if (offset) {
        query.push(`offset=${offset}`);
      }
      if (limit) {
        query.push(`limit=${limit}`);
      }
      if (query.length) {
        return state.girderClient.get(`jobs?${query.join('&')}`);
      }
      return state.girderClient.get('jobs');
    },
    async HTTP_JOBS_CREATE({ state }, job) {
      return state.girderClient.post('jobs', job);
    },
    async HTTP_JOBS_GET_BY_ID({ state }, id) {
      return state.girderClient.get(`jobs/${id}`);
    },
    async HTTP_JOBS_UPDATE({ state }, { id, content }) {
      return state.girderClient.patch(`jobs/${id}`, content);
    },
    async HTTP_JOBS_DELETE({ state }, id) {
      return state.girderClient.delete(`jobs/${id}`);
    },
    async HTTP_JOBS_GET_LOG({ state }, { id, offset = 0 }) {
      return state.girderClient.get(
        offset ? `jobs/${id}/log?offset=${offset}` : `jobs/${id}/log`
      );
    },
    async HTTP_JOBS_GET_OUTPUT({ state }, { id, path, offset = 0 }) {
      return state.girderClient.get(
        offset
          ? `jobs/${id}/log?path=${path}&offset=${offset}`
          : `jobs/${id}/log?path=${path}`
      );
    },
    async HTTP_JOBS_GET_STATUS({ state }, id) {
      return state.girderClient.get(`jobs/${id}/status`);
    },
    async HTTP_JOBS_TERMINATE({ state }, id) {
      return state.girderClient.put(`jobs/${id}/terminate`);
    },
    // --- VOLUMES ------------------------------------------------------------
    async HTTP_VOLUMES_LIST({ state }, limit = 0) {
      return state.girderClient.get(
        limit ? `volumes?limit=${limit}` : 'volumes'
      );
    },
    async HTTP_VOLUMES_CREATE({ state }, volume) {
      return state.girderClient.post('volumes', volume);
    },
    async HTTP_VOLUMES_GET({ state }, id) {
      return state.girderClient.get(`volumes/${id}`);
    },
    async HTTP_VOLUMES_DELETE({ state }, id) {
      return state.girderClient.delete(`volumes/${id}`);
    },
    async HTTP_VOLUMES_GET_LOG({ state }, { id, offset = 0 }) {
      const addOn = offset ? `?offset=${offset}` : '';
      return state.girderClient.get(`volumes/${id}/log${addOn}`);
    },
    async HTTP_VOLUMES_GET_STATUS({ state }, id) {
      return state.girderClient.get(`volumes/${id}/status`);
    },
    async HTTP_VOLUMES_ATTACH({ state }, { id, cluster }) {
      return state.girderClient.get(`volumes/${id}/attach/${cluster}`);
    },
    async HTTP_VOLUMES_DETACH({ state }, id) {
      return state.girderClient.get(`volumes/${id}/detach`);
    },
    // --- CLUSTERS -----------------------------------------------------------
    async HTTP_CLUSTERS_LIST({ state }, type) {
      return state.girderClient.get(
        type ? `clusters?type=${type}` : 'clusters'
      );
    },
    async HTTP_CLUSTERS_CREATE({ state }, cluster) {
      return state.girderClient.post('clusters', cluster);
    },
    async HTTP_CLUSTERS_GET({ state }, id) {
      return state.girderClient.get(`clusters/${id}`);
    },
    async HTTP_CLUSTERS_GET_PRESETS() {
      const response = await fetch('/clusters-presets.json');
      return response.json();
    },
    async HTTP_CLUSTERS_UPDATE({ state }, cluster) {
      const content = filterQuery(cluster, 'name', 'type', 'config');

      // Remove read only fields if any
      if (content.config.ssh && content.config.ssh.user) {
        content.config.ssh = { ...content.config.ssh };
        delete content.config.ssh.user;
      }
      if (content.config.host) {
        content.config = { ...content.config };
        delete content.config.host;
      }

      return state.girderClient.patch(`clusters/${cluster._id}`, content);
    },
    async HTTP_CLUSTERS_DELETE({ state }, id) {
      return state.girderClient.delete(`clusters/${id}`);
    },
    async HTTP_CLUSTERS_SUBMIT_JOB({ state }, { cluster, job }) {
      return state.girderClient.put(
        `clusters/${cluster._id}/job/${job._id}/submit`
      );
    },
    async HTTP_CLUSTERS_TASK_LOG({ state }, { id, offset = 0 }) {
      const query = offset ? `?offset=${offset}` : '';
      return state.girderClient.get(`clusters/${id}/log${query}`);
    },
    async HTTP_CLUSTERS_PROVISION({ state }, { id, content }) {
      return state.girderClient.put(`clusters/${id}/provision`, content);
    },
    async HTTP_CLUSTERS_START({ state }, id) {
      return state.girderClient.put(`clusters/${id}/start`);
    },
    async HTTP_CLUSTERS_TEST({ state }, id) {
      // alias of HTTP_CLUSTERS_START
      return state.girderClient.put(`clusters/${id}/start`);
    },
    async HTTP_CLUSTERS_STATUS({ state }, id) {
      // alias of HTTP_CLUSTERS_START
      return state.girderClient.get(`clusters/${id}/status`);
    },
    async HTTP_CLUSTERS_TERMINATE({ state }, id) {
      // alias of HTTP_CLUSTERS_START
      return state.girderClient.put(`clusters/${id}/terminate`);
    },
  },
};
