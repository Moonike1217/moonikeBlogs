---
title: Java代理模式
date: 2024-11-25T10:53:00
updated: 2025-05-20T14:18:00
categories: 
  - [Java, Java基础]
cover: 
---

代理模式也属于一种设计模式，简单来说就是我们实现一个代理对象，使其代替对真实对象的访问，这样就能够在不修改原对象的基础上来提供额外操作。代理对象的主要作用就是扩展目标对象的功能，比如在目标方法的执行前后添加一些自定义的操作。代理模式有 **静态代理** 和 **动态代理** 两种实现方式。


# 静态代理


静态代理的几个特点：

    - 一对一。每个目标类都要单独写一个代理类。
    - 纯手动。对每个方法的增强都是手动完成的，一旦接口中添加了新的方法，目标对象和代理对象都要修改。

静态代理的实现步骤：

    - 定义一个接口及其实现类（即被代理的类，我们可以称为目标类）。
    - 创建一个代理类，代理类同样要实现这个接口。
    - 将目标类注入代理类（确切来说应该是将目标类的实例对象注入），然后在代理类的对应方法中调用目标类的对应方法，在调用前后添加我们想要的操作。

代码展示：

1. 定义接口

    ```java
    public interface SmsService {
        String send(String message);
    }
    ```

2. 实现类

    ```java
    public class SmsServiceImpl implements SmsService {
        public String send(String message) {
            System.out.println("send message:" + message);
            return message;
        }
    }
    ```

3. 代理类

    ```java
    // 实现接口SmsService
    public class SmsProxy implements SmsService {
    
        private final SmsService smsService;
    
    		// 注入目标类
        public SmsProxy(SmsService smsService) {
            this.smsService = smsService;
        }
    
        @Override
        public String send(String message) {
            //调用方法之前，我们可以添加自己的操作
            System.out.println("before method send()");
            smsService.send(message);
            //调用方法之后，我们同样可以添加自己的操作
            System.out.println("after method send()");
            return null;
        }
    }
    ```

4. 使用

    ```java
    public class Main {
        public static void main(String[] args) {
            SmsService smsService = new SmsServiceImpl();
            SmsProxy smsProxy = new SmsProxy(smsService);
            smsProxy.send("java");
        }
    }
    ```


# 动态代理


Java中实现动态代理的方法有很多种，比如 **JDK动态代理** 和 **CGLIB动态代理** 。


## JDK 动态代理


在Java动态代理机制当中，核心为 `InvocationHandler` 接口和 `Proxy` 类。同时 `Proxy` 类中的 `newProxyInstance()` 方法为使用频率最高的方法，这个方法主要用来生成一个代理对象。


```java
public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
        ......
    }
```


这个方法有三个参数：

    - `loader` ： **被代理的类** 的 类加载器
    - `interfaces` ：被代理类实现的接口集合
    - `h` ：实现了 `InvocationHandler` 接口的对象（ `h` 实际上是一个多态引用）

当动态代理对象调用一个方法时，这个方法调用会被**转发到** **`h`** **的** **`invoke`** **方法**来处理。


```java
public interface InvocationHandler {

    /**
     * 当你使用代理对象调用方法的时候实际会调用到这个方法
     */
    public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
}
```


`invoke()` 方法有三个参数：

    - `proxy` ：动态生成的代理类
    - `method` ：被代理对象所实现的接口中的方法，也就是用户通过代理对象调用的那个方法
    - `args` ： `method` 方法的参数

也就是说：


**你通过****`Proxy`** **类的** **`newProxyInstance()`** **创建的代理对象，**


**在调用方法的时候，**


**实际会调用到实现****`InvocationHandler`** **接口的类的** **`invoke()`****方法。**你可以在 `invoke()`方法中自定义处理逻辑，


比如在方法执行前后做什么事情。


## 使用步骤

- 定义一个接口及其实现类；
- 自定义实现 `InvocationHandler` 接口的类，并重写`invoke`方法，在 `invoke` 方法中我们会调用原生方法（被代理类的方法）并在调用前后添加一些操作。
- 通过 `Proxy.newProxyInstance(ClassLoader loader,Class<?>[] interfaces,InvocationHandler h)` 方法创建代理对象（可以使用工厂类包装）

## CGLIB 动态代理


JDK动态代理有一个问题：只能代理实现了接口的类。为了解决这个问题，我们就可以使用CGLIB动态代理。


CGLIB 通过继承的方式实现代理。例如在 Spring 的 AOP 模块当中：如果目标对象实现了接口，则默认采用 JDK 动态代理，否则采用 CGLIB 动态代理。


CGLIB 动态代理的核心是 `MethodInterceptor` 接口和 `Enhancer` 类。


```java
public interface MethodInterceptor extends Callback{
    // 拦截被代理类中的方法
    public Object intercept(Object obj, java.lang.reflect.Method method, Object[] args,MethodProxy proxy) throws Throwable;
}
```


`MethodInterceptor` 接口中的 `intercept` 方法包含四个参数：

    - **obj** : 被代理的对象（需要增强的对象）
    - **method** : 被拦截的方法（被代理类中需要增强的方法）
    - **args** :`args` 是调用代理对象方法时传入的参数数组。这些是你在调用代理方法时提供的实际参数。
    - **proxy** : `proxy` 是 CGLIB 提供的 `MethodProxy` 对象，它代表了目标方法的代理方法。通过 `MethodProxy`，你可以调用目标对象的实际方法。

使用步骤：

    - 定义一个类；

        ```java
        package github.javaguide.dynamicProxy.cglibDynamicProxy;
        
        public class AliSmsService {
            public String send(String message) {
                System.out.println("send message:" + message);
                return message;
            }
        }
        ```

    - 自定义 `MethodInterceptor` 并重写 `intercept` 方法，`intercept` 用于拦截增强被代理类的方法，和 JDK 动态代理中的 `invoke` 方法类似；

        ```java
        import net.sf.cglib.proxy.MethodInterceptor;
        import net.sf.cglib.proxy.MethodProxy;
        
        import java.lang.reflect.Method;
        
        /**
         * 自定义MethodInterceptor
         */
        public class DebugMethodInterceptor implements MethodInterceptor {
        
        
            /**
             * @param o           被代理的对象（需要增强的对象）
             * @param method      被拦截的方法（需要增强的方法）
             * @param args        方法入参
             * @param methodProxy 用于调用原始方法
             */
            @Override
            public Object intercept(Object o, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
                //调用方法之前，我们可以添加自己的操作
                System.out.println("before method " + method.getName());
                Object object = methodProxy.invokeSuper(o, args);
                //调用方法之后，我们同样可以添加自己的操作
                System.out.println("after method " + method.getName());
                return object;
            }
        
        }
        ```

    - 通过 `Enhancer` 类的 `create()`创建代理类

        ```java
        import net.sf.cglib.proxy.Enhancer;
        
        public class CglibProxyFactory {
        
            public static Object getProxy(Class<?> clazz) {
                // 创建动态代理增强类
                Enhancer enhancer = new Enhancer();
                // 设置类加载器
                enhancer.setClassLoader(clazz.getClassLoader());
                // 设置被代理类
                enhancer.setSuperclass(clazz);
                // 设置方法拦截器
                enhancer.setCallback(new DebugMethodInterceptor());
                // 创建代理类
                return enhancer.create();
            }
        }
        ```

    - 使用

        ```java
        AliSmsService aliSmsService = (AliSmsService) CglibProxyFactory.getProxy(AliSmsService.class);
        aliSmsService.send("java");
        ```


### JDK 动态代理 和 CGLIB 动态代理 的对比

- **限制：JDK 动态代理只能代理实现了接口的类或者直接代理接口，而 CGLIB 可以代理未实现任何接口的类。** 另外， CGLIB 动态代理是通过生成一个被代理类的子类来拦截被代理类的方法调用，因此不能代理声明为 final 类型的类和方法。
- 效率：大部分情况都是 JDK 动态代理更优秀，随着 JDK 版本的升级，这个优势更加明显

# 静态代理和动态代理的对比


动态代理更加灵活。


静态代理在编译时就将接口、实现类、代理类这些都变成了一个个实际的 class 文件。而动态代理是在运行时动态生成类字节码，并加载到 JVM 中的。

