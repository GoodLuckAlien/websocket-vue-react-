import Socket from '../../utils/websocket'
import socketAction from '../../config/socket'

export default {
    state: {
        ws: null, // websorket实例
    
    },
    mutations: {

        contentSocket (state, { commit }) {
            state.ws = new Socket(commit, socketAction)
        }
    },
    actions: {
        // 创建实例
        socketInit ({commit, state}) {
            commit('contentSocket', { commit })
        }
    }
}