-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kind` ENUM('CUSTOMER', 'STAFF') NOT NULL DEFAULT 'CUSTOMER',
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(20) NULL,
    `passwordHash` VARCHAR(100) NULL,
    `emailVerified` DATETIME(3) NULL,
    `phoneVerified` DATETIME(3) NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en',
    `theme` VARCHAR(10) NOT NULL DEFAULT 'system',
    `marketingOptIn` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `roleId` INTEGER NULL,
    `loyaltyPoints` INTEGER NOT NULL DEFAULT 0,
    `tier` VARCHAR(20) NOT NULL DEFAULT 'Sapling',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    INDEX `User_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(60) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) NOT NULL,
    `group` VARCHAR(40) NOT NULL,
    `label` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(64) NOT NULL,
    `userId` INTEGER NOT NULL,
    `scope` VARCHAR(10) NOT NULL DEFAULT 'store',
    `csrfSecret` VARCHAR(64) NOT NULL,
    `userAgent` VARCHAR(255) NULL,
    `ip` VARCHAR(64) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OtpCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `target` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(20) NOT NULL,
    `codeHash` VARCHAR(100) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `consumed` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OtpCode_target_purpose_idx`(`target`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(60) NOT NULL,
    `entity` VARCHAR(60) NOT NULL,
    `entityId` VARCHAR(60) NULL,
    `summary` VARCHAR(255) NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OutboxMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channel` VARCHAR(10) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NULL,
    `body` TEXT NOT NULL,
    `provider` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OutboxMessage_to_idx`(`to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `descEn` TEXT NULL,
    `descBn` TEXT NULL,
    `image` VARCHAR(255) NULL,
    `icon` VARCHAR(40) NULL,
    `parentId` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metaTitleEn` VARCHAR(191) NULL,
    `metaTitleBn` VARCHAR(191) NULL,
    `metaDescEn` VARCHAR(320) NULL,
    `metaDescBn` VARCHAR(320) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Room` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `image` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Room_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `careEn` TEXT NULL,
    `careBn` TEXT NULL,

    UNIQUE INDEX `Material_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `kind` VARCHAR(10) NOT NULL DEFAULT 'own',
    `taglineEn` VARCHAR(255) NULL,
    `taglineBn` VARCHAR(255) NULL,
    `storyEn` TEXT NULL,
    `storyBn` TEXT NULL,
    `image` VARCHAR(255) NULL,
    `since` VARCHAR(60) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Brand_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Designer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `roleEn` VARCHAR(160) NULL,
    `roleBn` VARCHAR(160) NULL,
    `bioEn` TEXT NULL,
    `bioBn` TEXT NULL,
    `image` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Designer_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `introEn` TEXT NULL,
    `introBn` TEXT NULL,
    `year` VARCHAR(10) NULL,
    `heroImage` VARCHAR(255) NULL,
    `moodImages` JSON NULL,
    `brandId` INTEGER NULL,
    `designerId` INTEGER NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Collection_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `sku` VARCHAR(40) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameBn` VARCHAR(191) NOT NULL,
    `shortEn` VARCHAR(320) NULL,
    `shortBn` VARCHAR(320) NULL,
    `descriptionEn` TEXT NULL,
    `descriptionBn` TEXT NULL,
    `categoryId` INTEGER NOT NULL,
    `roomId` INTEGER NULL,
    `materialId` INTEGER NULL,
    `brandId` INTEGER NULL,
    `collectionId` INTEGER NULL,
    `price` INTEGER NOT NULL,
    `compareAtPrice` INTEGER NULL,
    `badge` VARCHAR(20) NULL,
    `stockStatus` ENUM('IN_STOCK', 'LOW', 'MADE_TO_ORDER', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
    `leadTimeDays` INTEGER NOT NULL DEFAULT 5,
    `widthCm` INTEGER NULL,
    `depthCm` INTEGER NULL,
    `heightCm` INTEGER NULL,
    `weightKg` DECIMAL(7, 2) NULL,
    `seats` INTEGER NULL,
    `assemblyRequired` BOOLEAN NOT NULL DEFAULT true,
    `emiAvailable` BOOLEAN NOT NULL DEFAULT true,
    `warrantyYears` INTEGER NOT NULL DEFAULT 10,
    `ratingAvg` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `soldCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `metaTitleEn` VARCHAR(191) NULL,
    `metaTitleBn` VARCHAR(191) NULL,
    `metaDescEn` VARCHAR(320) NULL,
    `metaDescBn` VARCHAR(320) NULL,
    `publishedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    UNIQUE INDEX `Product_sku_key`(`sku`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    INDEX `Product_brandId_idx`(`brandId`),
    INDEX `Product_collectionId_idx`(`collectionId`),
    INDEX `Product_price_idx`(`price`),
    INDEX `Product_isActive_isFeatured_idx`(`isActive`, `isFeatured`),
    FULLTEXT INDEX `Product_nameEn_nameBn_shortEn_idx`(`nameEn`, `nameBn`, `shortEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `altEn` VARCHAR(191) NULL,
    `altBn` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductImage_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `sku` VARCHAR(60) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `optionType` VARCHAR(20) NOT NULL DEFAULT 'finish',
    `swatchHex` VARCHAR(9) NULL,
    `priceDelta` INTEGER NOT NULL DEFAULT 0,
    `stockQty` INTEGER NOT NULL DEFAULT 0,
    `lowStockAt` INTEGER NOT NULL DEFAULT 3,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockMovement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variantId` INTEGER NOT NULL,
    `delta` INTEGER NOT NULL,
    `reason` VARCHAR(40) NOT NULL,
    `ref` VARCHAR(60) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockMovement_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `authorName` VARCHAR(120) NOT NULL,
    `location` VARCHAR(120) NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `photos` JSON NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'pending',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `reply` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Review_productId_status_idx`(`productId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `contact` VARCHAR(191) NOT NULL,
    `notified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StockAlert_productId_contact_key`(`productId`, `contact`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishlistItem` (
    `userId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleBn` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `cityEn` VARCHAR(120) NULL,
    `cityBn` VARCHAR(120) NULL,
    `year` VARCHAR(10) NULL,
    `area` VARCHAR(60) NULL,
    `scopeEn` TEXT NULL,
    `scopeBn` TEXT NULL,
    `storyEn` TEXT NULL,
    `storyBn` TEXT NULL,
    `heroImage` VARCHAR(255) NULL,
    `images` JSON NULL,
    `collectionSlugs` JSON NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image` VARCHAR(255) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleBn` VARCHAR(191) NOT NULL,
    `category` VARCHAR(40) NOT NULL,
    `brandSlug` VARCHAR(80) NULL,
    `collectionSlug` VARCHAR(80) NULL,
    `room` VARCHAR(40) NULL,
    `material` VARCHAR(40) NULL,
    `projectType` VARCHAR(20) NULL,
    `productId` INTEGER NULL,
    `hotspotX` INTEGER NULL,
    `hotspotY` INTEGER NULL,
    `tall` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GalleryItem_category_idx`(`category`),
    INDEX `GalleryItem_brandSlug_idx`(`brandSlug`),
    INDEX `GalleryItem_collectionSlug_idx`(`collectionSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Catalogue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `kind` VARCHAR(12) NOT NULL,
    `ref` VARCHAR(80) NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleBn` VARCHAR(191) NOT NULL,
    `season` VARCHAR(10) NULL,
    `coverImage` VARCHAR(255) NULL,
    `pdfUrl` VARCHAR(255) NOT NULL,
    `pageImages` JSON NULL,
    `pages` INTEGER NOT NULL DEFAULT 0,
    `sizeKb` INTEGER NOT NULL DEFAULT 0,
    `downloads` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Catalogue_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CatalogueRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(320) NOT NULL,
    `catalogues` JSON NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'new',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `placement` VARCHAR(40) NOT NULL DEFAULT 'home-hero',
    `titleEn` VARCHAR(191) NOT NULL,
    `titleBn` VARCHAR(191) NOT NULL,
    `subtitleEn` VARCHAR(320) NULL,
    `subtitleBn` VARCHAR(320) NULL,
    `ctaEn` VARCHAR(60) NULL,
    `ctaBn` VARCHAR(60) NULL,
    `href` VARCHAR(255) NULL,
    `image` VARCHAR(255) NOT NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleBn` VARCHAR(191) NOT NULL,
    `bodyEn` LONGTEXT NOT NULL,
    `bodyBn` LONGTEXT NOT NULL,
    `metaDescEn` VARCHAR(320) NULL,
    `metaDescBn` VARCHAR(320) NULL,
    `isPolicy` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Page_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleBn` VARCHAR(191) NOT NULL,
    `excerptEn` VARCHAR(320) NULL,
    `excerptBn` VARCHAR(320) NULL,
    `bodyEn` LONGTEXT NOT NULL,
    `bodyBn` LONGTEXT NOT NULL,
    `categoryEn` VARCHAR(60) NOT NULL,
    `categoryBn` VARCHAR(60) NOT NULL,
    `coverImage` VARCHAR(255) NULL,
    `authorName` VARCHAR(120) NOT NULL DEFAULT 'Shekor Studio',
    `readMinutes` INTEGER NOT NULL DEFAULT 5,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_isPublished_publishedAt_idx`(`isPublished`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupEn` VARCHAR(60) NOT NULL,
    `groupBn` VARCHAR(60) NOT NULL,
    `questionEn` VARCHAR(320) NOT NULL,
    `questionBn` VARCHAR(320) NOT NULL,
    `answerEn` TEXT NOT NULL,
    `answerBn` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Showroom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `city` VARCHAR(40) NOT NULL,
    `addressEn` VARCHAR(255) NOT NULL,
    `addressBn` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `hours` VARCHAR(60) NOT NULL DEFAULT '10:00–21:00',
    `isFlagship` BOOLEAN NOT NULL DEFAULT false,
    `lat` DECIMAL(9, 6) NOT NULL,
    `lng` DECIMAL(9, 6) NOT NULL,
    `image` VARCHAR(255) NULL,
    `services` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Showroom_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(255) NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `mime` VARCHAR(80) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `alt` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryZone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `nameBn` VARCHAR(120) NOT NULL,
    `divisions` JSON NOT NULL,
    `districts` JSON NULL,
    `charge` INTEGER NOT NULL,
    `freeOver` INTEGER NULL,
    `assemblyFee` INTEGER NOT NULL DEFAULT 0,
    `leadDaysMin` INTEGER NOT NULL DEFAULT 2,
    `leadDaysMax` INTEGER NOT NULL DEFAULT 5,
    `codAvailable` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `DeliveryZone_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `label` VARCHAR(40) NOT NULL DEFAULT 'Home',
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `division` VARCHAR(40) NOT NULL,
    `district` VARCHAR(60) NOT NULL,
    `area` VARCHAR(120) NOT NULL,
    `line1` VARCHAR(255) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Address_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `descriptionEn` VARCHAR(191) NULL,
    `descriptionBn` VARCHAR(191) NULL,
    `type` VARCHAR(12) NOT NULL,
    `value` INTEGER NOT NULL,
    `minSubtotal` INTEGER NOT NULL DEFAULT 0,
    `maxDiscount` INTEGER NULL,
    `usageLimit` INTEGER NULL,
    `perUserLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Coupon_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNo` VARCHAR(20) NOT NULL,
    `userId` INTEGER NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('UNPAID', 'PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `paymentMethod` VARCHAR(20) NOT NULL,
    `paymentPlan` VARCHAR(12) NOT NULL DEFAULT 'full',
    `advancePercent` INTEGER NOT NULL DEFAULT 0,
    `customerName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `division` VARCHAR(40) NOT NULL,
    `district` VARCHAR(60) NOT NULL,
    `area` VARCHAR(120) NOT NULL,
    `line1` VARCHAR(255) NOT NULL,
    `zoneId` INTEGER NULL,
    `zoneName` VARCHAR(120) NULL,
    `deliveryDate` DATETIME(3) NULL,
    `deliverySlot` VARCHAR(20) NULL,
    `assembly` BOOLEAN NOT NULL DEFAULT true,
    `notes` VARCHAR(500) NULL,
    `subtotal` INTEGER NOT NULL,
    `discount` INTEGER NOT NULL DEFAULT 0,
    `deliveryCharge` INTEGER NOT NULL DEFAULT 0,
    `assemblyCharge` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL,
    `amountPaid` INTEGER NOT NULL DEFAULT 0,
    `couponId` INTEGER NULL,
    `couponCode` VARCHAR(40) NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en',
    `trackingToken` VARCHAR(40) NOT NULL,
    `pointsEarned` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNo_key`(`orderNo`),
    INDEX `Order_userId_idx`(`userId`),
    INDEX `Order_status_idx`(`status`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    INDEX `Order_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `variantId` INTEGER NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameBn` VARCHAR(191) NOT NULL,
    `variantName` VARCHAR(120) NULL,
    `sku` VARCHAR(60) NOT NULL,
    `image` VARCHAR(255) NULL,
    `unitPrice` INTEGER NOT NULL,
    `qty` INTEGER NOT NULL,
    `lineTotal` INTEGER NOT NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL,
    `note` VARCHAR(320) NULL,
    `actorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderStatusHistory_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `kind` VARCHAR(12) NOT NULL DEFAULT 'full',
    `amount` INTEGER NOT NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'initiated',
    `providerRef` VARCHAR(120) NULL,
    `sessionId` VARCHAR(64) NOT NULL,
    `raw` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_sessionId_key`(`sessionId`),
    INDEX `Payment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoyaltyTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `reason` VARCHAR(120) NOT NULL,
    `orderNo` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoyaltyTransaction_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomOrderRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ref` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `city` VARCHAR(60) NULL,
    `pieceType` VARCHAR(80) NOT NULL,
    `material` VARCHAR(60) NULL,
    `dimensions` VARCHAR(120) NULL,
    `budget` VARCHAR(60) NULL,
    `details` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `quoteAmount` INTEGER NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomOrderRequest_ref_key`(`ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationBooking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ref` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `mode` VARCHAR(20) NOT NULL,
    `showroomId` INTEGER NULL,
    `date` DATETIME(3) NOT NULL,
    `timeSlot` VARCHAR(20) NOT NULL,
    `rooms` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'requested',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConsultationBooking_ref_key`(`ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TradeInquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ref` VARCHAR(20) NOT NULL,
    `company` VARCHAR(160) NOT NULL,
    `contactName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(40) NOT NULL,
    `projectSize` VARCHAR(60) NULL,
    `timeline` VARCHAR(60) NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TradeInquiry_ref_key`(`ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(20) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'new',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `Designer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAlert` ADD CONSTRAINT `StockAlert_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAlert` ADD CONSTRAINT `StockAlert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GalleryItem` ADD CONSTRAINT `GalleryItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoyaltyTransaction` ADD CONSTRAINT `LoyaltyTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationBooking` ADD CONSTRAINT `ConsultationBooking_showroomId_fkey` FOREIGN KEY (`showroomId`) REFERENCES `Showroom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
