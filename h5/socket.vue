<template>
    <div>
       hello , world
    </div>
</template>

<script>
export default {
   
    created () {
          if (!socket.ws) {
            //在socket.vue文件中初始化socket连接
            this.$store.dispatch('socketInit')
          }
          
    },
    methods: {
       emit(){
            const { ws } = this.$store.state.socket
            ws.$soctket_emit(JSON.stringify({
                data: 'hello , world'
            }), () => {
               console.log('发送成功')
            })
       }
    }
}
</script>

<style scoped lang="scss">
   

</style>
