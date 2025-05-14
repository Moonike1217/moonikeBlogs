---
updated: '2025-05-14T02:49:00.000Z'
categories: Java/Java基础
date: '2025-05-13T06:44:00.000Z'
cover: ''
title: Java 注解（Annotation）
---

# 什么是注解


Java 注解（Annotation）是一种 **元数据**（描述数据的数据），以 `@注解名` 的形式附加在类、方法、字段等代码元素上，用于提供额外信息。注解不会也不能影响代码的实际逻辑，仅仅起到辅助性的作用，其包含在 `java.lang.annotation` 包中。


# 注解的用处

- **代码标记**：如 `@Deprecated` 标记过时方法。
- **框架配置**：如 Spring 的 `@Controller`、MyBatis 的 `@Mapper`。
- **编译检查**：如 Lombok 的 `@Data` 自动生成代码。
- **AOP 切面**：如 `@Transactional` 声明事务。
- **自动化测试**：如 JUnit 的 `@Test`。

# 元注解


元注解其实就是修饰注解的注解，也就是说注解修饰的对象是注解本身，用于定义注解的作用范围和作用对象。下面列举一些常用的元注解：


### **@Retention**

- 作用：指定注解的生命周期（即注解信息保留到哪个阶段）。
- 参数类型：RetentionPolicy 枚举
    - SOURCE：注解仅在源代码中保留，不会出现在编译后的字节码文件中。适用于注解处理器处理的注解。
    - CLASS：注解在源代码和字节码文件中保留，但在运行时不可见。适用于在编译阶段处理的注解。
    - RUNTIME：注解在源代码、字节码文件和运行时都可见。适用于运行时通过反射处理的注解。

### **@Target**

- 作用：指定注解可以应用于哪些Java元素（如类、方法、字段等）。
- 参数类型：ElementType 枚举
    - 常见值有：TYPE（类、接口）、METHOD（方法）、FIELD（字段）、PARAMETER（参数）等。

### **@Inherited**

- 作用：指定被修饰的注解可以被子类继承（仅对类有效）。如果一个超类被 `@Inherited` 注解过的注解进行注解的话，那么如果它的子类没有被任何注解应用的话，那么这个子类就继承了超类的注解。
- 没有参数。

# 注解的实现原理


### **编译阶段注解信息的存储**


在 Java 编译阶段，源代码中的注解信息会被编译器写入到 `.class` 字节码文件的元数据区。具体来说，像 RuntimeVisibleAnnotations 这样的属性表会专门用来存储注解相关的数据。这样做的目的是让 JVM 或其他工具在后续阶段能够读取到这些注解信息。


### **运行时注解实例的生成与原理**


当程序运行时，如果你通过反射（比如调用 `getAnnotation()` 方法）去获取某个注解，JVM 会创建一个实现了该注解接口的动态代理对象。这个代理对象的生成过程依赖于JDK内部的`AnnotationInvocationHandler` 动态代理处理器（或类似机制）。

- 这个代理处理器会把注解的所有属性和值存储在一个 Map 结构中。
- 当你调用获取到的注解实例上的方法（比如 `myAnnotation.value()`）时，实际上是由代理处理器拦截这个方法调用，然后从 Map 中取出对应的值并返回。
- 例如，如果注解定义为 `@MyAnnotation(value=10)`，那么获取到注解实例后调用 `value()` 方法时，代理会返回10。

### **编译期注解处理器（APT）**


除了运行时反射，Java 还提供了APT（Annotation Processing Tool，注解处理器），它可以在编译期间扫描和处理注解。比如 Lombok 的 `@Data` 注解，APT 会在编译时根据注解自动生成 getter/setter 等代码，这个过程不需要在运行时通过反射来处理注解。


# 自定义注解


在我的一个项目中，通过自定义注解实现了防止用户重复提交的功能。注解定义如下：


```java
@Target(ElementType.METHOD) // 该注解作用在方法上
@Retention(RetentionPolicy.RUNTIME) // 该注解在程序运行时可通过反射读取
public @interface NoDuplicateSubmit {

		// 触发幂等失败逻辑时，返回的错误提示信息
    String message() default "您操作太快，请稍后再试";
}
```


注解定义完成后，将其与 AOP 结合，即可在业务层面上实现幂等。


```java
@Aspect
@RequiredArgsConstructor
public final class NoDuplicateSubmitAspect {

    private final RedissonClient redissonClient;

    /**
     * 增强方法标记 {@link NoDuplicateSubmit} 注解逻辑
     */
    @Around("@annotation(com.example.framework.idempotent.NoDuplicateSubmit)")
    public Object noDuplicateSubmit(ProceedingJoinPoint joinPoint) throws Throwable {
		    // 获取注解
        NoDuplicateSubmit noDuplicateSubmit = getNoDuplicateSubmitAnnotation(joinPoint);
        // 获取分布式锁标识
        String lockKey = getLockKey(getCurrentUserId());
        // 获取分布式锁
        RLock lock = redissonClient.getLock(lockKey);
        // 尝试获取锁，获取锁失败就意味着已经重复提交，直接抛出异常
        if (!lock.tryLock()) {
            throw new ClientException(noDuplicateSubmit.message());
        }
        Object result;
        try {
            // 执行标记了防重复提交注解的方法原逻辑
            result = joinPoint.proceed();
        } finally {
            lock.unlock();
        }
        return result;
    }

    /**
     * @return 返回自定义防重复提交注解
     */
    public static NoDuplicateSubmit getNoDuplicateSubmitAnnotation(ProceedingJoinPoint joinPoint) throws NoSuchMethodException {
        MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
        Method targetMethod = joinPoint.getTarget().getClass().getDeclaredMethod(methodSignature.getName(), methodSignature.getMethod().getParameterTypes());
        return targetMethod.getAnnotation(NoDuplicateSubmit.class);
    }
```

